// ============================================================================
// تایپ‌های jalaali-js
// ============================================================================

declare module "jalaali-js" {
  interface JalaaliDate {
    jy: number;
    jm: number;
    jd: number;
  }

  interface GregorianDate {
    gy: number;
    gm: number;
    gd: number;
  }

  function toJalaali(date: Date | number | string): JalaaliDate;
  function toJalaali(
    gy: number,
    gm: number,
    gd: number
  ): JalaaliDate;
  function toGregorian(
    jy: number,
    jm: number,
    jd: number
  ): GregorianDate;
  function isValidJalaaliDate(
    jy: number,
    jm: number,
    jd: number
  ): boolean;
  function jalaaliMonthLength(jy: number, jm: number): number;

  export {
    toJalaali,
    toGregorian,
    isValidJalaaliDate,
    jalaaliMonthLength,
  };
  export default {
    toJalaali,
    toGregorian,
    isValidJalaaliDate,
    jalaaliMonthLength,
  };
}
