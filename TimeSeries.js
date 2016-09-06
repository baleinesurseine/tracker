function TimeSeries (client, namespace) {
  this.namespace = namespace
  this.client = client
  this.units = {
    second: 1,
    minute: 60,
    hour: 60 * 60,
    day: 60 * 60 * 24
  }
  this.granularities = {
    '1sec': { name: '1sec', ttl: this.units.hour * 2, duration: this.units.second, quantity: this.units.minute * 5 },
    '1min': { name: '1min', ttl: this.units.day * 7, duration: this.units.minute, quantity: this.units.hour * 8 },
    '1hour': { name: '1hour', ttl: this.units.day * 60, duration: this.units.hour, quantity: this.units.day * 10 },
    '1day': { name: '1day', ttl: null, duration: this.units.day, quantity: this.units.day * 30 }
  }
}
TimeSeries.prototype.insert = function (timeStampInSeconds, id) {
  for (var granularitiyName in this.granularities) {
    var granularity = this.granularities[granularitiyName]
    var key = this._getKeyName(granularity, timeStampInSeconds, id)
    var fieldName = this._getRoundedTimeStamp(timeStampInSeconds, granularity.duration)
    this.client.hincrby(key, fieldName, 1)
    if (granularity.ttl !== null) {
      this.client.expire(key, granularity.ttl)
    }
  }
}

TimeSeries.prototype._getKeyName = function (granularity, timeStampInSeconds, id) {
  var roundedTimeStamp = this._getRoundedTimeStamp(timeStampInSeconds, granularity.quantity)
  return [this.namespace, id, granularity.name, roundedTimeStamp].join(':')
}

TimeSeries.prototype._getRoundedTimeStamp = function (timeStampInSeconds, precision) {
  return Math.floor(timeStampInSeconds / precision) * precision
}

TimeSeries.prototype.fetch = function (granularityName, beginTimestamp, endTimestamp, callback) {
  var granularity = this.granularities[granularityName]
  var begin = this._getRoundedTimestamp(beginTimestamp, granularity.duration)
  var end = this._getRoundedTimestamp(endTimestamp, granularity.duration)
  var multi = this.client.multi()
  for (var timestamp = begin; timestamp <= end; timestamp += granularity.duration) {
    var key = this._getKeyName(granularity, timestamp)
    var fieldName = this._getRoundedTimestamp(timestamp, granularity.duration)
    multi.hget(key, fieldName)
  }
  multi.exec(function (err, replies) {
    if (err) { callback(err, null) }
    var results = []
    for (var i = 0; i < replies.length; i++) {
      var timestamp = beginTimestamp + i * granularity.duration
      var value = parseInt(replies[i], 10) || 0
      results.push({timestamp: timestamp, value: value})
    }
    callback(null, results)
  })
}

exports.TimeSeries = TimeSeries
