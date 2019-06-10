export const IG_CHART = { // ID charts in the database
  IMPRESSIONS: 15,
  AUD_GENDER_AGE: 16,
  AUD_LOCALE: 17,
  REACH: 18,
  AUD_CITY: 19,
  AUD_COUNTRY: 20,
  ACTION_PERFORMED: 21,
  ONLINE_FOLLOWERS: 22,
  PROFILE_VIEWS: 23,
  FOLLOWER_COUNT: 28,
};

export interface IgPage {
  name: string;
  id: string;
}

export interface IgMedia {
  id: number,
  media_type: string,
  timestamp: Date
}

export interface IgBusinessInfo {
  id: number,
  follower_count: number,
  media_count: number,
}

export interface IgAnyData {
  value: Array<any>;
  end_time: Date;
}

export interface IgNumberData {
  value: number;
  end_time: Date;
}
