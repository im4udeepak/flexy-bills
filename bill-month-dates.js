/**
 * Bill month date/time helpers: current year, selected month, random day + random time per generate click.
 */
(function (global) {
  function currentYear() {
    return new Date().getFullYear();
  }

  function daysInMonth(monthIndex, year) {
    return new Date(year, monthIndex + 1, 0).getDate();
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function toDateInputValue(year, monthIndex, day) {
    return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
  }

  function toDateTimeLocalValue(year, monthIndex, day, hours, minutes) {
    return `${toDateInputValue(year, monthIndex, day)}T${pad2(hours)}:${pad2(minutes)}`;
  }

  function createGenerator() {
    function pickDay(monthIndex, year) {
      const maxDay = daysInMonth(monthIndex, year);
      return randomInt(1, maxDay);
    }

    function randomTimeOfDay() {
      return {
        hours: randomInt(8, 21),
        minutes: randomInt(0, 59)
      };
    }

    function generateForMonth(monthIndex) {
      const year = currentYear();
      const day = pickDay(monthIndex, year);
      const time = randomTimeOfDay();
      return {
        year,
        monthIndex,
        day,
        hours: time.hours,
        minutes: time.minutes,
        dateValue: toDateInputValue(year, monthIndex, day),
        dateTimeLocalValue: toDateTimeLocalValue(year, monthIndex, day, time.hours, time.minutes)
      };
    }

    function resetForMonth() {
      /* Reserved for month-change hooks; each generate uses a fresh random day. */
    }

    return { generateForMonth, resetForMonth, currentYear, daysInMonth };
  }

  function populateMonthSelect(selectEl, selectedMonthIndex) {
    if (!selectEl) return;
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const now = new Date();
    const defaultMonth = typeof selectedMonthIndex === 'number'
      ? selectedMonthIndex
      : now.getMonth();

    selectEl.innerHTML = '';
    months.forEach((name, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = name;
      if (index === defaultMonth) option.selected = true;
      selectEl.appendChild(option);
    });
  }

  global.BillMonthDates = {
    createGenerator,
    populateMonthSelect,
    currentYear
  };
})(typeof window !== 'undefined' ? window : globalThis);
