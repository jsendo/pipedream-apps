const { google } = require('googleapis');

let tokens = null
if (process.env.RUNTIME === "local") {
  const fs = require('fs')
  const raw = fs.readFileSync("tokens.json")
  tokens = JSON.parse(raw)
}

console.log(process.env.RUNTIME)

const googleCalendar = {
  type: "app",
  app: "google_calendar",
  propDefinitions: {
  },
  methods: {
    _tokens() {
      if (tokens) {
        return tokens
      }
      return {
        "access_token": this.$auth.oauth_access_token,
        "refresh_token": this.$auth.oauth_refresh_token,
      }
    },
    // returns a calendar object you can do whatever you want with
    calendar() {
      const auth = new google.auth.OAuth2()
      auth.setCredentials(this._tokens())
      const calendar = google.calendar({version: "v3", auth})
      return calendar
    },
    // for config key value pairs - https://developers.google.com/calendar/v3/reference/events/list
    async getEvents(config) {
      const calendar = this.calendar()
      const resp = await calendar.events.list(config)
      return resp
    }
  }
}

const component = {
  name: 'calendar',
  version: '0.0.1',
  props: {
    calendarId: {
      type: "string"
    },
    googleCalendar,
    timer: {
      type: "$.interface.timer",
      default: {
        cron: "* * * * *",
      },
    },
  },
  async run(event) {
    const now = new Date()

    const timeMin = new Date(now.getTime()).toISOString()
    const timeMax = new Date(now.getTime()+  (1000 * 1)).toISOString()

    const config = {
      calendarId: this.calendarId,
      timeMin,
      maxResults: 1,
      singleEvents: true,
      orderBy: 'startTime',
    }
    const resp = await this.googleCalendar.getEvents(config)

    if (resp && resp.data && resp.data.items && Array.isArray(resp.data.items) && resp.data.items.length) {
      const event = resp.data.items[0]
      const eventStart = new Date(event.start.dateTime)
      if (eventStart.getTime() - now.getTime() < (1000 * 60 * 10)) {
        console.log("emitting data")
        this.$emit(resp.data)
      } else {
        console.log("not emitting since event start time is > than 10 mins from now")
      }
    } else {
//      console.log(resp)
      console.log("nothing to emit")
    }
  },
};

console.log("before run")
component.run(null).then( a => console.log(a))
console.log("after run")

module.exports = component
