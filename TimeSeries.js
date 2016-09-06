function TimeSeries(client, namespace) {
  this.namespace = namespace
  this.client = client
  this.units = {
    second: 1,
    minute: 60,
    hour: 60 * 60,
    day: 60 * 60 * 24
  }
  this.granularities = {
    '1sec' : { name: '1sec', ttl: this.units.hour * 2, duration: this.units.second },
    '1min' : { name: '1min', ttl: this.units.day * 7, duration: this.units.minute },
    '1hour' : { name: '1hour', ttl: this.units.day * 60, duration: this.units.hour },
    '1day': { name: '1day', ttl: null, duration: this.units.day }
  }
}
TimeSeries.prototype.insert = function(timeStampInSeconds, id) {
  for (var granularitiyName in this.granularities) {
    var granularity = this.granularities[granularitiyName]
    var key = this._getKeyName(granularity, timeStampInSeconds, id)
    this.client.incr(key)
    if (granularity.ttl !== null) {
      this.client.expire(key, granularity.ttl)
    }
  }
}

TimeSeries.prototype._getKeyName = function (granularity, timeStampInSeconds, id) {
  var roundedTimeStamp = this._getRoundedTimeStamp(timeStampInSeconds, granularity.duration)
  return [this.namespace, id, granularity.name, roundedTimeStamp].join(':')
}

TimeSeries.prototype._getRoundedTimeStamp = function (timeStampInSeconds, precision) {
  return Math.floor(timeStampInSeconds / precision) * precision
}

exports.TimeSeries = TimeSeries
