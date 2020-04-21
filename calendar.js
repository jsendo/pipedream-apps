const { google } = require('googleapis');

const googleCalendar = {
  type: "app",
  app: "google_calendar",
  propDefinitions: {
  },
  methods: {
    _tokens() {
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
module.exports = {
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
      const fromNow = eventStart.getTime() - now.getTime()
      if (fromNow < (1000 * 60 * 10)) {
        console.log("emitting data")
        this.$emit(resp.data)
      } else {
        const minsFromNow = fromNow / (1000 * 60)
        console.log(`not emitting since event start time is ${minsFromNow} mins from now`)
      }
    } else {
//      console.log(resp)
      console.log("nothing to emit")
    }
  },
};
