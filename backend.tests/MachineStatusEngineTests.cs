using Xunit;

public sealed class MachineStatusEngineTests
{
    private readonly MachineStatusEngine _engine = new();
    private static readonly DateTimeOffset Start = new(2026, 8, 11, 8, 0, 0, TimeSpan.FromHours(7));

    [Fact]
    public void CounterIncreaseChangesStatusToRunning()
    {
        var config = Configuration(MachineParameterType.Counter);
        var initial = State(config) with { CurrentValue = 1200, LastChangeTime = Start, SourceTimestamp = Start };

        var result = _engine.Evaluate(config, initial, 1201, Start.AddSeconds(1), Start.AddSeconds(1));

        Assert.Equal("RUNNING", result.State.OperationalStatus);
        Assert.True(result.StatusChanged);
        Assert.Equal(Start.AddSeconds(1), result.State.RunningStartedAt);
    }

    [Fact]
    public void CounterStopsAfterConfiguredNoChangeWindow()
    {
        var config = Configuration(MachineParameterType.Counter);
        var running = State(config) with
        {
            CurrentValue = 1200,
            OperationalStatus = "RUNNING",
            LastChangeTime = Start,
            StopCandidateStartedAt = Start,
            RunningStartedAt = Start,
            SourceTimestamp = Start
        };

        var result = _engine.Evaluate(config, running, 1200, Start.AddSeconds(10), Start.AddSeconds(10));

        Assert.Equal("STOPPED", result.State.OperationalStatus);
        Assert.Equal(10, result.State.TotalRunningSeconds);
        Assert.Null(result.State.RunningStartedAt);
    }

    [Fact]
    public void CounterStopsAfterTenObservedSecondsEvenWhenSourceRowIsUnchanged()
    {
        var config = Configuration(MachineParameterType.Counter);
        var running = State(config) with
        {
            CurrentValue = 1001,
            OperationalStatus = "RUNNING",
            RunningStartedAt = Start,
            LastChangeTime = Start,
            StopCandidateStartedAt = Start,
            SourceTimestamp = Start
        };

        var afterFiveSeconds = _engine.Evaluate(config, running, 1001, Start, Start.AddSeconds(5)).State;
        var afterTenSeconds = _engine.Evaluate(config, afterFiveSeconds, 1001, Start, Start.AddSeconds(10)).State;

        Assert.Equal("RUNNING", afterFiveSeconds.OperationalStatus);
        Assert.Equal("STOPPED", afterTenSeconds.OperationalStatus);
        Assert.Equal(10, afterTenSeconds.TotalRunningSeconds);
    }

    [Fact]
    public void CounterResetCreatesEventWithoutForcingStopped()
    {
        var config = Configuration(MachineParameterType.Counter);
        var running = State(config) with
        {
            CurrentValue = 5000,
            OperationalStatus = "RUNNING",
            RunningStartedAt = Start,
            SourceTimestamp = Start
        };

        var result = _engine.Evaluate(config, running, 0, Start.AddSeconds(1), Start.AddSeconds(1));

        Assert.Equal("COUNTER_RESET", result.CounterEvent);
        Assert.Equal("RUNNING", result.State.OperationalStatus);
        Assert.False(result.StatusChanged);
    }

    [Fact]
    public void SpeedUsesThresholdAndTimeout()
    {
        var config = Configuration(MachineParameterType.Speed);
        var initial = State(config) with { CurrentValue = 0, SourceTimestamp = Start };
        var running = _engine.Evaluate(config, initial, 5, Start.AddSeconds(1), Start.AddSeconds(1)).State;
        var firstZero = _engine.Evaluate(config, running, 0, Start.AddSeconds(2), Start.AddSeconds(2)).State;
        var stopped = _engine.Evaluate(config, firstZero, 0, Start.AddSeconds(12), Start.AddSeconds(12)).State;

        Assert.Equal("RUNNING", running.OperationalStatus);
        Assert.Equal("RUNNING", firstZero.OperationalStatus);
        Assert.Equal("STOPPED", stopped.OperationalStatus);
    }

    [Fact]
    public void SpeedRecoveryBeforeTimeoutClearsStopCandidate()
    {
        var config = Configuration(MachineParameterType.Speed);
        var running = _engine.Evaluate(config, State(config), 5, Start, Start).State;
        var zero = _engine.Evaluate(config, running, 0, Start.AddSeconds(1), Start.AddSeconds(1)).State;
        var recovered = _engine.Evaluate(config, zero, 8, Start.AddSeconds(5), Start.AddSeconds(5)).State;

        Assert.Equal("RUNNING", recovered.OperationalStatus);
        Assert.Null(recovered.StopCandidateStartedAt);
    }

    [Theory]
    [InlineData(0.5, "STOPPED")]
    [InlineData(1.0, "STOPPED")]
    [InlineData(1.2, "RUNNING")]
    [InlineData(0.9, "STOPPED")]
    public void WeightUsesStrictGreaterThanThreshold(double value, string expected)
    {
        var config = Configuration(MachineParameterType.Weight, threshold: 1);
        var result = _engine.Evaluate(config, State(config), value, Start, Start);
        Assert.Equal(expected, result.State.OperationalStatus);
    }

    [Fact]
    public void RunningHoursAccumulateUsingTimestampsAndSurviveReloadedState()
    {
        var config = Configuration(MachineParameterType.Weight, threshold: 1);
        var running = _engine.Evaluate(config, State(config), 1.2, Start, Start).State;
        var stopped = _engine.Evaluate(config, running, 0.9, Start.AddHours(2.5), Start.AddHours(2.5)).State;
        var restarted = _engine.Evaluate(config, stopped, 1.2, Start.AddHours(5), Start.AddHours(5)).State;
        var final = _engine.Evaluate(config, restarted, 0.9, Start.AddHours(6), Start.AddHours(6)).State;

        Assert.Equal(3.5, final.RunningHoursAt(Start.AddHours(6)), 6);
        var reloaded = final with { ConnectionStatus = "REALTIME CONNECTED" };
        Assert.Equal(3.5, reloaded.RunningHoursAt(Start.AddHours(7)), 6);
    }

    private static MachineAcquisitionConfiguration Configuration(MachineParameterType type, double threshold = 0) =>
        new("TEST_MACHINE", 1, "TEST MACHINE", "LINE 08", "Test", "test_table", "timestamp_zone", "test_value", "Test Value", type, "", threshold, 10, true);

    private static MachineRuntimeState State(MachineAcquisitionConfiguration configuration) => new()
    {
        MachineId = configuration.MachineId,
        MachineName = configuration.MachineName,
        Line = configuration.Line,
        ParameterName = configuration.ParameterName,
        ParameterType = configuration.ParameterType,
        ParameterUnit = configuration.ParameterUnit,
        LastUpdate = Start
    };
}
