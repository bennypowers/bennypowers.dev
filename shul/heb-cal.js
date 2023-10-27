import { LitElement, html, css } from 'lit';
import { HDate, HebrewCalendar, Location, Zmanim } from '@hebcal/core';

class HebCalChild extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
      }

      dl {
        display: grid;
        grid-template-columns: max-content auto;
      }

      dt {
        font-family: sans;
        text-align: left;
      }

      dd {
        font-family: sans-serif;
        font-weight: bold;
      }
    `,
  ];

  /** @type {HebCal} */
  get hebcal() {
    return this.closest(HebCal.is);
  }

  get i18n() {
    return this.hebcal.i18n;
  }
}

/**
 * @property {string} city;
 *
 */
export class HebCal extends LitElement {
  static is = 'heb-cal';

  static styles = [
    css`
      hgroup {
      }
    `,
  ];

  static properties = {
    locale: { type: String },
    city: { type: String },
    tzeitAngle: { type: String },
    candlesMinutesBeforeSundown: { type: Number, attribute: 'candles-minutes-before-sundown' },
    havdalaMinutesAfterNightfall: { type: Number, attribute: 'havdala-minutes-after-nightfall' },
  }

  static i18n = {
    'he-IL': {
      alotHaShachar: 'עלות השחר',
      misheyakir: 'משיכיר',
      sunrise: 'נץ',
      sofZmanShmaMGA: 'סוף זמן קריאת שמע (מג״א)',
      sofZmanShma: 'סוף זמן קריאת שמע (גר״א)',
      sofZmanTfillaMGA: 'סוף זמן תפילה (מג״א)',
      sofZmanTfilla: 'סוף זמן תפילה (גר״א)',
      sunset: 'שקיעה',
      minchaGedola: 'מנחה גדולה',
      minchaKetana: 'מנחה קטנה',
      plagHaMincha: 'פלג המנחה',
      tzeit: 'צאת הכוכבים',
      shabbat: 'שבת',
      chag: 'יום טוב',
      zmanei: 'זמני',
    },
    'en-US': {
      alotHaShachar: 'dawn',
      misheyakir: 'misheyakir',
      sunrise: 'sunrise',
      sofZmanShmaMGA: 'Latest Shema (Gr"a)',
      sofZmanShma: 'Latest Shema (Magen Avraham)',
      sofZmanTfillaMGA: 'Latest Tefillah (Gr"a)',
      sofZmanTfilla: 'Latest Tefillah (Magen Avraham)',
      sunset: 'sunset',
      minchaGedola: 'mincha gedola',
      minchaKetana: 'mincha ketana',
      plagHaMincha: 'plag hamincha',
      tzeit: 'nightfall',
      shabbat: 'Shabbat',
      chag: 'Yom Tov',
      zmanei: 'Halachic Times for',
    }
  }

  static {
    this.i18n.he = this.i18n['he-IL'];
    this.i18n.en = this.i18n['en-US'];
    this.i18n['en-GB'] = this.i18n['en-US'];
  }

  static { customElements.define(this.is, this); }

  /** @type {Zmanim} */
  #zmanim;

  /** @type {ReturnType<typeof HebrewCalendar['calendar']>} */
  events;

  /** @type {Location} */
  #location;

  get i18n() { return HebCal.i18n[this.locale]; }

  constructor() {
    super();
    this.city = 'Jerusalem';
    this.locale = 'he-IL';
    this.tzeitAngle = 7.083 /* 3 medium stars */
    this.zmanim = {};
    this.events = [];
  }

  /** @param {import('lit').PropertyValues<this>} changed */
  willUpdate(changed) {
    this.updateZmanim();
  }

  updated() {
    for (const child of this.children) {
      if (child instanceof HebCalChild)
        child.requestUpdate();
    }
  }

  connectedCallback() {
    super.connectedCallback();
    setInterval(() => this.updateZmanim(), 1000 * 60 * 60 * 6);
  }

  render() {
    const locale = this.locale.substring(0, 2);
    const timeZoneName = new Intl.DateTimeFormat(locale, { timeZoneName: 'long' })
      .formatToParts(new Date())
      .find(x => x.type === "timeZoneName")?.value??'';
    return html`
      <hgroup part="locale-name">
        <h3>${this.hDate?.render(locale)}</h3>
        <small>${timeZoneName}</small>
      </hgroup>
      <slot></slot>
    `;
  }

  updateZmanim() {
    this.#location = Location.lookup(this.city);
    if (this.#location) {
      const start = new Date;
      const end = new Date(start)
      end.setDate(start.getDate() + 1);
      this.#zmanim = new Zmanim(
        new Date(),
        this.#location.getLatitude(),
        this.#location.getLongitude(),
      );
      this.events = HebrewCalendar.calendar({
        location: this.#location,
        start,
        end,
        candlelighting: true,
        candleLightingMins: 40,
        havdalahDeg: this.tzeitAngle,
        il: this.locale.endsWith('IL'),
      })
      this.zmanim = {
        [this.i18n.alotHaShachar]: this.#zmanim.alotHaShachar(),
        [this.i18n.misheyakir]: this.#zmanim.misheyakir(),
        [this.i18n.sunrise]: this.#zmanim.sunrise(),
        [this.i18n.sofZmanShmaMGA]: this.#zmanim.sofZmanShmaMGA(),
        [this.i18n.sofZmanShma]: this.#zmanim.sofZmanShma(),
        [this.i18n.sofZmanTfillaMGA]: this.#zmanim.sofZmanTfillaMGA(),
        [this.i18n.sofZmanTfilla]: this.#zmanim.sofZmanTfilla(),
        [this.i18n.minchaGedola]: this.#zmanim.minchaGedola(),
        [this.i18n.minchaKetana]: this.#zmanim.minchaKetana(),
        [this.i18n.plagHaMincha]: this.#zmanim.plagHaMincha(),
        [this.i18n.sunset]: this.#zmanim.sunset(),
        [this.i18n.tzeit]: this.#zmanim.tzeit(this.tzeitAngle),
      };
      this.hDate = new HDate(new Date);
      this.isShabbat = this.hDate.getDay() === 6;
      this.isErevShabbat = this.hDate.getDay() === 5;
      this.requestUpdate();
    }
  }
}

export class ZmanimTimes extends HebCalChild {
  static is = 'zmanim-times';

  static { customElements.define(this.is, this); }

  render() {
    const { i18n, zmanim } = this.hebcal;
    return html`
      <slot></slot>
      <dl>${Object.entries(zmanim ?? {}).map(([name, date]) => html`
        <dt part="list term">
          ${name}
          <small ?hidden="${name !== i18n.tzeit}">(${this.hebcal.tzeitAngle}°)</small>
        </dt>
        <dd part="list definition">
          <time datetime="${date.toISOString()}">
            ${date.toLocaleTimeString('he-IL', { timeStyle: 'medium' })}
          </time>
        </dd>`)}
      </dl>
    `;
  }
}

export class ShabbatTimes extends HebCalChild {
  static is = 'shabbat-times';

  static styles = [
    ...HebCalChild.styles,
    css`
      #events {
        font-size: 200%;
      }
    `,
  ]

  static { customElements.define(this.is, this); }

  render() {
    const { i18n, isShabbat, isErevShabbat } = this.hebcal;
    const locale = this.hebcal.locale.substring(0, 1);
    if (this.hebcal.events?.length) {
      return html`
        <h4>${i18n.zmanei} ${i18n[isShabbat || isErevShabbat ? 'shabbat' : 'chag']}</h4>
        <dl id="events" part="events">${this.hebcal.events.map(event => html`
          <dt part="list term">
            ${event.getEmoji()}
            ${event.renderBrief(locale)}
          </dt>
          <dd part="list definition">
            <time datetime="${event.eventTime.toISOString()}">
              ${event.eventTimeStr}
            </time>
          </dd>`)}
        </dl>
      `;
    }
  }
}
