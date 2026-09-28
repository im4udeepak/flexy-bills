(function (global) {
  var SHARED_KEY = 'flexy_bills_shared_profile';

  function readJson(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (err) {
      return {};
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      // Ignore quota / private-mode failures
    }
  }

  function getSharedProfile() {
    return readJson(SHARED_KEY);
  }

  function setSharedProfile(patch) {
    var current = getSharedProfile();
    Object.keys(patch || {}).forEach(function (key) {
      if (patch[key] !== undefined && patch[key] !== null) {
        current[key] = patch[key];
      }
    });
    writeJson(SHARED_KEY, current);
    return current;
  }

  function getEl(id) {
    return document.getElementById(id);
  }

  function readFieldValue(el) {
    if (!el) return '';
    return el.value;
  }

  function writeFieldValue(el, value) {
    if (!el || value === undefined || value === null) return;
    el.value = String(value);
  }

  /**
   * Bind form fields to localStorage.
   * @param {Object} config
   * @param {string} config.pageKey - unique page storage key
   * @param {string[]} config.fields - element ids to persist on this page
   * @param {Object<string,string>} [config.sharedMap] - fieldId -> shared profile key
   * @param {Function} [config.onChange] - called after restore or user edits
   */
  function bind(config) {
    var pageKey = config.pageKey;
    var fields = config.fields || [];
    var sharedMap = config.sharedMap || {};
    var onChange = typeof config.onChange === 'function' ? config.onChange : function () {};
    var storageKey = 'flexy_bills_' + pageKey;

    function persist() {
      var pageData = readJson(storageKey);
      var sharedPatch = {};

      fields.forEach(function (id) {
        var el = getEl(id);
        if (!el) return;
        var value = readFieldValue(el);
        pageData[id] = value;
        if (sharedMap[id]) {
          sharedPatch[sharedMap[id]] = value;
        }
      });

      writeJson(storageKey, pageData);
      if (Object.keys(sharedPatch).length) {
        setSharedProfile(sharedPatch);
      }
    }

    function restore() {
      var pageData = readJson(storageKey);
      var shared = getSharedProfile();

      fields.forEach(function (id) {
        var el = getEl(id);
        if (!el) return;

        var value;
        if (Object.prototype.hasOwnProperty.call(pageData, id) && pageData[id] !== '') {
          value = pageData[id];
        } else if (sharedMap[id] && shared[sharedMap[id]] !== undefined && shared[sharedMap[id]] !== '') {
          value = shared[sharedMap[id]];
        }

        if (value !== undefined) {
          writeFieldValue(el, value);
        }
      });
    }

    restore();
    onChange();

    fields.forEach(function (id) {
      var el = getEl(id);
      if (!el) return;
      el.addEventListener('input', function () {
        persist();
        onChange();
      });
      el.addEventListener('change', function () {
        persist();
        onChange();
      });
    });

    return {
      persist: persist,
      restore: restore
    };
  }

  global.FormStorage = {
    bind: bind,
    getSharedProfile: getSharedProfile,
    setSharedProfile: setSharedProfile
  };
})(window);
