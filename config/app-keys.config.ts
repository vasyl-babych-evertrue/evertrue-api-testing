/**
 * Application Keys Configuration
 * Contains all APP_KEY values for different services
 */

export const APP_KEYS = {
  auth_api: '388e0c953a1f80539b9468f90cf09b386b0d560f539865b8488a0a1f40373402',
  contacts_api: '4e04e428cefe60b4df22eff60c1b3045fa7de2d8847eba6b84ccd3906cc23654',
  lids_api: '84731a780476587920ee41a93feba4b0b69f66f444fc1c2ff7111eafdf7cb946',
  console: '89567e74bec3afafc5f46db72b1a9323f41858256e3bec5dc9e522a7b3f3518f',
  community: '590b6855ec417400015682e454c6acec8f371adf861b830b031fa9ad3ac84c90',
  givingtree: '815e8d01be8f78a41d1c71eb652b8be124b89058b74d284c6bb752a034dbb301',
  capi_migrator: 'a9f518459b91dcde5b6576241dbb9a7afb35a20062e33a764ecf62d71b3fe919',
  csv_importer: 'ef571795d45d5be4994a3beebbf2fcb9d24466d45cbf6877250ba822420d3c64',
  reds_api: 'e9042aa96d9df1633652e79274c4b1e12f866afd63813a12e1df4618ec8f79d5',
  reds_shuttle: 'ce3f8f84b193fcb9f2478067fa840d4f35a6909b8230325d3bf88e11f7f2f65f',
  reporting_api: '1d5a39ffe6214709661cc681d285af5d8748aca1e4b23269564154ec29487caf',
  search_api: '5a787185cebe2bab517fc3061ee94c1f7e7f0b01000eddaeff1eea897e490f07',
  storm: 'e83f22bc52f446ecc09c5274dc7a930535925f36995bffa7dea21d6fa17972f7',
  ems_api: 'b120b0d16f15251de408af6428836dd0d1986e0d845c0372c8f30217feafc28e',
  dna_api: '425431e00e7b1f257c4923227a4a0ab1e58120fb8b8f1863b70f45bb063a902c',
  hadoop: '5087f1d0493aa43c0bbcadd674400b5381f54a5aa852176e5993e1c14622aabc',
  upload: 'd6e29212be59dfca79f4233a69a6a3d58003a584716214c5c7f8576e284bda4b',
  scout_auth_api: '1d347e8d5949aa2c43c1c97a0961d1c35cb1b72acebb953723ac762e483d6049',
  scout_contacts_api: 'bb4abe5756d78fce3e7df7c941e15c78d6011a0568a9203a5642c4b68bcc5815',
  scout_lids_api: '911fec246fa64f88e35151e3dc291123e9211752cd0bae7eedcb411233e2f764',
  scout_importer: 'dfa19b7fe7c30a755e809f2460819fd7e4e1c37ddcd3e21cbb68d4ea8a5bcb2b',
  scout_ems_api: 'f7c2413c3f9540468d32660c2e8e63a9d5afed3355a3a9f9b2f45b02b5063b92',
  scout_dna_api: 'c8e01d6a34886269cb2939068afb62b056ec8d19194276c8ea7a61692c0bff93',
  soda_fountain: '574d8cb82aed95447e2e0cd4ff9bb8adfd9eefcba4fa5cab7789ab82e4835931',
  buoys: '85afd59f40d96f9f07b0045ebf62d40cbd74d1848deb142c31be69f6754bf199',
  ugc_api: '70037042b0fd1b999add0962e14a5959f526409b51ef5411db3a95aac644ee00',
  harbormaster: '79f75cc77a83bd935c3400d0996951501739e70366d4e3e9476be09c6aa8ce50',
  payments_api: '63c1272b1063657c7cc1e5be012e51487237715aa39c997dd1636cd281f63a3a',
  windlass: 'e45bfeb7b5b0cf5b7e97c5de7ba8d83b4c88128dbabf1355186d569c96d48ae0',
  salesforce_syncer: 'b023f41b87581779da604caadcf78134e59d5507cb2d992515db837e1c752917',
  volunteers_api: '67f058495b1e266de2cf0b28feb57acec271320653950a4cd1b6d5ade767eef2',
  volunteers: '7cb9b8d4451567b725e81b998cdf46cfc58426f9936916c714acddbc9f082546'
} as const;

/**
 * Get APP_KEY by service name
 * @param serviceName - Name of the service
 * @returns APP_KEY string or undefined if not found
 */
export function getAppKey(serviceName: keyof typeof APP_KEYS): string {
  return APP_KEYS[serviceName];
}

/**
 * Get all available service names
 * @returns Array of service names
 */
export function getAvailableServices(): string[] {
  return Object.keys(APP_KEYS);
}

/**
 * Default APP_KEY for console service (most commonly used in tests)
 */
export const DEFAULT_APP_KEY = APP_KEYS.console;
