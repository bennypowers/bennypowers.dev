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

  static { customElements.define(this.is, this); }

  static properties = {
    locale: { type: String },
    city: { type: String },
    tzeitAngle: { type: String },
    candlesMinutesBeforeSundown: { type: Number, attribute: 'candles-minutes-before-sundown' },
    havdalaMinutesAfterNightfall: { type: Number, attribute: 'havdala-minutes-after-nightfall' },
  }

  static i18n = {
    'he-IL': {
      alotHaShachar: 'עלות',
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

  render() {
    return html`<slot></slot>`
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
    const { i18n, zmanim, hDate } = this.hebcal;
    const locale = this.hebcal.locale.substring(0, 1);
    return html`
      <h3>${hDate?.render(locale)}</h3>
      <dl>${Object.entries(zmanim ?? {}).map(([name, date]) => html`
        <dt>${name}</dt>
        <dd>
          <time datetime="${date.toISOString()}">${date.toLocaleTimeString('he-IL', { timeStyle: 'full' })}</time>
          ${name === i18n.tzeit ? `${this.hebcal.tzeitAngle}°` : '' }
        </dd>`)}
      </dl>
    `;
  }
}

export class ShabbatTimes extends HebCalChild {
  static is = 'shabbat-times';

  static { customElements.define(this.is, this); }

  render() {
    const { i18n, isShabbat, isErevShabbat } = this.hebcal;
    const locale = this.hebcal.locale.substring(0, 1);
    if (this.hebcal.events?.length) {
      return html`
        <h4>${i18n.zmanei} ${i18n[isShabbat || isErevShabbat ? 'shabbat' : 'chag']}</h4>
        <ol id="events">${this.hebcal.events.map(event => html`
          <li>
            ${event.getEmoji()}
            ${event.render(locale)}</li>`)}
        </ol>
      `;
    }
  }
}
