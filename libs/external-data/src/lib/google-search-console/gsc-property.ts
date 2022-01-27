export const filterDimensions = {
    'country': {'description': 'Filter against the specified country, as specified by 3-letter country code (ISO 3166-1 alpha-3).'},
    "device": {'description':'Filter results against the specified device type. Supported values in expression: "desktop", "mobile", "tablet"'},
    'page': {'description':'Filter against the specified URI string.'},
    "query": {'description':'Filter against the specified query string.'},
    "searchAppearance": {'description':'Filter against a specific search result feature. To see a list of available values, run a query grouped by "searchAppearance".'},
}

export const filterOperator = {
    "contains": {'description': 'The row value must either contain or equal your expression (non-case-sensitive).'},
    "equals": {'description': '[Default] Your expression must exactly equal the row value (case-sensitive for page and query dimensions).'},
    "notContains": {'description': 'The row value must not contain your expression either as a substring or a (non-case-sensitive) complete match.'},
    "notEquals": {'description': 'Your expression must not exactly equal the row value (case-sensitive for page and query dimensions).'},
    "includingRegex": {'description': 'An RE2 syntax regular expression that must be matched.'},
    "excludingRegex": {'description': 'An RE2 syntax regular expression that must not be matched.'},
}

export const dimensions = {
    'date': {'description': 'Filter against the date'},
    'country': {'description': 'Filter against the specified country, as specified by 3-letter country code (ISO 3166-1 alpha-3).'},
    "device": {'description':'Filter results against the specified device type. Supported values in expression: "desktop", "mobile", "tablet"'},
    'page': {'description':'Filter against the specified URI string.'},
    "query": {'description':'Filter against the specified query string.'},
    "searchAppearance": {'description':'Filter against a specific search result feature. To see a list of available values, run a query grouped by "searchAppearance".'},
}

export const aggregationType = {
    "auto": {'description': '[Default] Let the service decide the appropriate aggregation type.'},
    "byPage": {'description': 'Aggregate values by URI.'},
    "byProperty": {'description': 'Aggregate values by property. Not supported for type=discover or type=googleNews'},
}

export const dataState = {
    "all": {'description': 'Data will include fresh data.'},
    "final": {'description': 'The returned data will include only finalized data.'},
}

export const type = {
    "discover": {'description': 'Discover results'},
    "googleNews": {'description': 'Results from news.google.com and the Google News app on Android and iOS. Doesn\'t include results from the "News" tab in Google Search.'},
    "news": {'description': 'Search results from the "News" tab in Google Search.'},
    "image": {'description': 'Search results from the "Image" tab in Google Search.'},
    "video": {'description': 'Video search results'},
    "web": {'description': '[Default] Filter results to the combined ("All") tab in Google Search. Does not include Discover or Google News results.'},
}

export type FilterDimension = keyof typeof filterDimensions;
export type FilterOperator = keyof typeof filterOperator;
export type dimension = keyof typeof dimensions;
export type aggregationType = keyof typeof aggregationType;
export type dataState = keyof typeof dataState;
export type type = keyof typeof type;