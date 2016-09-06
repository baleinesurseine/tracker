var express = require('express')
var logger = require('morgan')
var compression = require('compression')
var methodOverride = require('method-override')
var bodyParser = require('body-parser')
var uaparser = require('ua-parser')
var redis = require('redis')

var helmet = require('helmet')




var app = express()
app.use(helmet())
app.use(helmet.hidePoweredBy())

app.set('port', process.env.PORT || process.argv[2] || 6000)
app.use(compression())
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

var client = redis.createClient(6379, 'redis')

var TimeSeries = require('./TimeSeries')
var timeSeries = new TimeSeries.TimeSeries(client, 'tracker')

app.use(methodOverride('_method'))

var router = express.Router()

router.get('/', function (req, res, next) {
  console.log('used get/')
  process.nextTick(function () {
    // tracking operations
    var qu = req && req.query
    var token = qu && qu.token
    var ip = req && req.headers['x-real-ip'] || req.headers['X-Real-IP'] || req.connection.remoteAddress
    var ua = req && uaparser.parse(req.headers['user-agent'])
    console.log('query: ' + JSON.stringify(qu))
    console.log('token: ' + token)
    console.log('ip: ' + ip)
    console.log('browser: ' + ua.ua.toString())
    console.log('OS: ' + ua.os.toString())
    console.log('device: ' + ua.device.toString())

    timeSeries.insert(Date.now() / 1000 | 0, ip)
    timeSeries.insert(Date.now() / 1000 | 0, device)

  })
  return res.status(204).send()
})

app.use(router)

app.get('*', function (req, res, next) {
  var err = new Error()
  err.status = 404
  next(err)
})
app.use(function (err, req, res, next) {
  if (err.status !== 404) {
    return next()
  }
  return res.status(404).send('Ressource not found')
})

app.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'))
})

module.exports = app
