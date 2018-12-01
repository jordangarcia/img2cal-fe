import moment from "moment";
import _ from "lodash";
const endpoint = "https://6vix2gcz0h.execute-api.us-west-2.amazonaws.com/dev/main";
// const endpoint = "http://localhost:3001/main";
const TITLE_MAX_LENGTH = 32;

class Component extends React.Component {
  state = {
    url: "",
    isLoading: false,
    result: null
  };

  onSubmit = this.onSubmit.bind(this);
  changeUrl = e => this.setState({ url: e.target.value });

  async analyzeImage() {
    const { url } = this.state;
    const resp = await fetch(`${endpoint}?url=${url}`, {
      mode: "cors"
    });
    const result = await resp.json();
    this.setState({
      result
    });
  }

  createLink() {
    const { result } = this.state;
    const { startDate, endDate } = this.getStartEndDate(result);

    const link =
      "https://www.google.com/calendar/render?" +
      "action=TEMPLATE" +
      `&text=${this.getTitle(result)}` +
      `&dates=${startDate
        .utc()
        .format("YYYYMMDD[T]HHmmss[Z]")}/${endDate
        .utc()
        .format("YYYYMMDD[T]HHmmss[Z]")}` +
      `&details=Created with img2cal`;
    return link;
  }
  renderResult() {
    const { result, isLoading } = this.state;
    if (isLoading) {
      return "...thinking";
    }
    if (!result) {
      return null;
    }

    const { startDate, endDate } = this.getStartEndDate(result);

    return (
      <ul>
        <li>Title: {this.getTitle(result)}</li>
        <li>Date: {`${startDate} - ${endDate}`}</li>
        <li>
          <a target="_blank" href={this.createLink()}>
            Google Cal Link
          </a>
        </li>
      </ul>
    );
  }

  getTitle(result) {
    if (!result || !result.words) {
      return;
    }

    if (result.people.length) {
      if (result.people[0] && result.people[0].score > 0.8) {
        return result.people[0].value;
      }
    }

    let title = "";
    const words = result.words.join(" ").split(" ");
    for (let word of words) {
      let toTry = title.concat(" " + word);
      if (toTry.length < TITLE_MAX_LENGTH) {
        title = toTry;
      } else {
        break;
      }
    }
    return title;
  }

  getStartEndDate(result) {
    const res = this.getDate(result);
    console.log(res);
    const { date, hasTime } = res;
    let startDate, endDate;
    if (hasTime) {
      startDate = date;
      endDate = moment(date).add(1, "h");
      // TODO figure out duration
    } else {
      startDate = date;
      endDate = moment(date).add(1, "d");
    }
    return { startDate, endDate };
  }

  getDate(result) {
    if (!result || !result.dates) {
      return;
    }
    const dates = _.chain(result.dates)
      .filter(({ score }) => score > 0.8)
      .filter(({ value }) => {
        return value.start.month && value.start.day;
      })
      .map(({ value }) => {
        let hasTime = false;
        let { month, day, year, hour, minute } = value.start;
        if (hour != null && minute != null) {
          hasTime = true;
        }

        hour = hour || "00";
        minute = minute || "00";

        let d = moment(`${year}-${month}-${day} ${hour}:${minute}`);

        return {
          date: d,
          hasTime
        };
      })
      .value();

    return dates[0];
  }

  async onSubmit(e) {
    e.preventDefault();
    this.setState({
      isLoading: true
    });
    await this.analyzeImage();
    this.setState({
      isLoading: false
    });
  }

  render() {
    const { isLoading } = this.state
    return (
      <>
        <form onSubmit={this.onSubmit}>
          <h1>img2cal</h1>
          <h2>How to use</h2>
          <p>1. Find an image link with an event in it</p>
          <p>2. Paste image link below</p>
          <p>3. ???</p>
          <p>4. Use link to create Google Calendar Event</p>
          <input
            type="text"
            value={this.state.url}
            onChange={this.changeUrl}
            style={{ width: 300, display: 'block' }}
          />
          <button type="submit" disabled={isLoading}>submit</button>
        </form>
        {this.renderResult()}
      </>
    );
  }
}
export default () => <Component />;
