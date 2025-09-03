/**
 * Data Loader Service
 * 加载和管理本地数据源，为规则引擎提供数据支持
 */

class DataLoader {
  constructor() {
    this.data = {
      countries: null,
      holidays: null,
      privacyRegions: null,
      taxes: null,
      timezones: null,
      addresses: null,
      tlds: null,
      rates: null,
      cldr: null
    };
    this.loaded = false;
    this.loadPromise = null;
  }

  /**
   * 加载所有数据源
   */
  async loadAllData() {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this._loadData();
    return this.loadPromise;
  }

  async _loadData() {
    try {
      // 并行加载所有数据文件
      const [
        countries,
        holidays, 
        privacyRegions,
        taxes,
        timezones,
        addresses,
        tlds,
        rates,
        cldr
      ] = await Promise.allSettled([
        this._loadJSON('/data/sources/countries.json'),
        this._loadJSON('/data/sources/holidays.json'),
        this._loadJSON('/data/sources/privacy_regions.json'),
        this._loadJSON('/data/sources/taxes.json'),
        this._loadJSON('/data/sources/timezones.json'),
        this._loadJSON('/data/sources/addresses.json'),
        this._loadJSON('/data/sources/tlds.json'),
        this._loadJSON('/data/sources/rates-ecb.json'),
        this._loadJSON('/data/sources/cldr-core.json')
      ]);

      // 处理加载结果
      this.data.countries = countries.status === 'fulfilled' ? countries.value : null;
      this.data.holidays = holidays.status === 'fulfilled' ? holidays.value : null;
      this.data.privacyRegions = privacyRegions.status === 'fulfilled' ? privacyRegions.value : null;
      this.data.taxes = taxes.status === 'fulfilled' ? taxes.value : null;
      this.data.timezones = timezones.status === 'fulfilled' ? timezones.value : null;
      this.data.addresses = addresses.status === 'fulfilled' ? addresses.value : null;
      this.data.tlds = tlds.status === 'fulfilled' ? tlds.value : null;
      this.data.rates = rates.status === 'fulfilled' ? rates.value : null;
      this.data.cldr = cldr.status === 'fulfilled' ? cldr.value : null;

      this.loaded = true;

      console.log('Data Loader: All data sources loaded', {
        countries: !!this.data.countries,
        holidays: !!this.data.holidays,
        privacyRegions: !!this.data.privacyRegions,
        taxes: !!this.data.taxes,
        timezones: !!this.data.timezones,
        addresses: !!this.data.addresses,
        tlds: !!this.data.tlds,
        rates: !!this.data.rates,
        cldr: !!this.data.cldr
      });

      return this.data;
    } catch (error) {
      console.error('Data Loader: Failed to load data sources', error);
      throw error;
    }
  }

  async _loadJSON(path) {
    try {
      const response = await fetch(chrome.runtime.getURL(path));
      if (!response.ok) {
        throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Data Loader: Failed to load ${path}`, error);
      throw error;
    }
  }

  /**
   * 获取国家信息
   */
  getCountryInfo(countryCode) {
    if (!this.data.countries || !this.data.countries.data) {
      return null;
    }

    return this.data.countries.data.find(
      country => 
        country.countryCode === countryCode || 
        country.countryCode3 === countryCode
    );
  }

  /**
   * 获取国家语言列表
   */
  getCountryLanguages(countryCode) {
    const country = this.getCountryInfo(countryCode);
    return country ? Object.values(country.languages || {}) : [];
  }

  /**
   * 获取国家货币信息
   */
  getCountryCurrencies(countryCode) {
    const country = this.getCountryInfo(countryCode);
    return country ? country.currencies : {};
  }

  /**
   * 获取隐私政策要求
   */
  getPrivacyRequirements(countryCode) {
    if (!this.data.privacyRegions || !this.data.privacyRegions.data) {
      return null;
    }

    const regions = this.data.privacyRegions.data.regions;
    return regions[countryCode] || null;
  }

  /**
   * 获取国家假日信息
   */
  getCountryHolidays(countryCode) {
    if (!this.data.holidays || !this.data.holidays.data) {
      return [];
    }

    // holidays.json结构需要进一步分析来实现完整的假日查询
    const countries = this.data.holidays.data.countries || [];
    return countries.includes(countryCode) ? [] : [];
  }

  /**
   * 检查是否为严格隐私保护地区 (GDPR等)
   */
  isStrictPrivacyRegion(countryCode) {
    const privacy = this.getPrivacyRequirements(countryCode);
    return privacy && privacy.regime === 'strict';
  }

  /**
   * 检查是否需要Cookie同意
   */
  requiresCookieConsent(countryCode) {
    const privacy = this.getPrivacyRequirements(countryCode);
    return privacy && (
      privacy.cookie_consent === 'required' || 
      privacy.cookie_consent === 'likely_required'
    );
  }

  /**
   * 获取适用的法律法规
   */
  getApplicableLaws(countryCode) {
    const privacy = this.getPrivacyRequirements(countryCode);
    return privacy ? privacy.laws || [] : [];
  }

  /**
   * 检查国家是否支持特定语言
   */
  supportsLanguage(countryCode, languageCode) {
    const languages = this.getCountryLanguages(countryCode);
    return languages.some(lang => 
      lang.toLowerCase().includes(languageCode.toLowerCase())
    );
  }

  /**
   * 获取国家的主要语言
   */
  getPrimaryLanguage(countryCode) {
    const country = this.getCountryInfo(countryCode);
    if (!country || !country.languages) {
      return null;
    }

    const languages = Object.keys(country.languages);
    return languages[0] || null;
  }

  /**
   * 获取所有可用的国家代码
   */
  getAllCountryCodes() {
    if (!this.data.countries || !this.data.countries.data) {
      return [];
    }

    return this.data.countries.data.map(country => country.countryCode);
  }

  /**
   * 检查数据是否已加载
   */
  isLoaded() {
    return this.loaded;
  }

  /**
   * 获取数据源元信息
   */
  getMetaInfo() {
    const meta = {};
    Object.keys(this.data).forEach(key => {
      if (this.data[key] && this.data[key]._meta) {
        meta[key] = this.data[key]._meta;
      }
    });
    return meta;
  }
}

// 创建全局实例
const dataLoader = new DataLoader();

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataLoader;
} else {
  window.DataLoader = DataLoader;
  window.dataLoader = dataLoader;
}