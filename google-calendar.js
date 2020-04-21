const { google } = require('googleapis');

let tokens = null

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
  name: 'calendar2',
  version: '0.0.1',
  props: {
    calendarId: {
      type: "string"
    },
    googleCalendar,
    timer: {
      type: "$.interface.timer",
      default: {
        cron: "0/5 * * * *",
      },
    },
  },
  async run(event) {
    console.log("this start")
    console.log(this)

    console.log("this end")
    const now = new Date()

    const timeMin = new Date(now.getTime()).toISOString()
    const timeMax = new Date(now.getTime()+  (1000 * 1)).toISOString()

    const config = {
      calendarId: this.calendarId,
      timeMin,
//      maxResults: 1,
      singleEvents: true,
      orderBy: 'startTime',
    }
    const resp = await this.googleCalendar.getEvents(config)

    if (resp && resp.data && resp.data.items && Array.isArray(resp.data.items) && resp.data.items.length) {
      this.$emit(resp.data)
      const event = resp.data.items[0]
      const eventStart = new Date(event.start.dateTime)
/*      if (eventStart.getTime() - now.getTime() < (1000 * 60 * 10)) {
        console.log("emitting data")
        this.$emit(resp.data)
      } else {
        console.log("not emitting since event start time is > than 10 mins from now")
      }*/
    } else {
//      console.log(resp)
      console.log("nothing to emit")
    }
  },
};

if (process.env.RUNTIME === "local") {
  const fs = require('fs')
  const raw = fs.readFileSync("tokens.json")

  // $ stuff
  component.$emit = (ev) => {
    console.log("$EMIT START")
    console.log(ev)
    console.log("$EMIT END")
  }

  // app methods // TODO expand methods object
  googleCalendar._tokens = googleCalendar.methods._tokens
  googleCalendar.calendar = googleCalendar.methods.calendar
  googleCalendar.getEvents = googleCalendar.methods.getEvents


  // component props TODO expand props
  component.calendarId = "pipedream.com_8khjp5mfv7t6tdsnnlo85bm18c@group.calendar.google.com"
  component.googleCalendar = component.props.googleCalendar
  tokens = JSON.parse(raw)
  console.log("before run")
  component.run(null).then( a => console.log(a))
  console.log("after run")
}

module.exports = component
