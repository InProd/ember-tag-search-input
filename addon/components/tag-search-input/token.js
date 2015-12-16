import Ember from 'ember';
import DateSource from './hint-popup/date/adapter';
import ListSource from './hint-popup/list/adapter';
import DefaultSource from './hint-popup/default/adapter';

const { computed, get, set } = Ember;

export default Ember.Object.extend({
  modifier: '',
  value: '',

  modifierConfig: {},

  config: computed('modifierConfig', 'modifier', 'value', function() {
    let modifierConfig = get(this, 'modifierConfig');
    let modifier = get(this, 'modifier');
    let value = get(this, 'value');

    if (modifier) {
      return modifierConfig[modifier];
    } else if (value && (value !== ' ')) {
      return modifierConfig['_default'];
    }
  }),

  type: computed('config.type', function() {
    return get(this, 'config.type') || 'space';
  }),

  sectionTitle: computed.reads('config.sectionTitle'),
  content: computed.reads('config.content'),
  adapter: computed('type', function() {
    const type = get(this, 'type');
    if (type === 'list' || type === 'modifier-list') {
      return ListSource;
    } else if (type === 'date') {
      return DateSource;
    } else {
      return DefaultSource;
    }
  }),

  fullText: computed('modifier', 'value', 'modifierConfig', {
    get() {
      return get(this, 'modifier') + get(this, 'value');
    },
    set(key, val) {
      let configs = get(this, 'modifierConfig');
      if (configs) {
        let modifier;
        if (val.substr(0, 1) === '+') {
          modifier = '+';
        } else {
          for (let k in configs) {
            if (val.substr(0, k.length) === k) {
              modifier = k;
              break;
            }
          }
        }
        if (modifier) {
          let value = val.substr(modifier.length);
          set(this, 'modifier', modifier);
          set(this, 'value', value);
        } else if (val) {
          set(this, 'value', val);
        }
      }
      return val;
    }
  }),

  length: computed.reads('fullText.length'),

  firstHint: computed.reads('hints.firstObject'),

  subHint: computed('value', 'adapter', 'firstHint', function() {
    let value = get(this, 'value');
    let firstHint = get(this, 'firstHint');
    let hint = typeof firstHint === 'string' ?
      firstHint : get(this, 'adapter').serialize(firstHint);
    let valueLength = value.length;
    if (valueLength && hint && hint.indexOf(value) === 0) {
      return hint.substr(valueLength);
    }
  }),

  hint: computed('subHint', 'config.defaultHint', 'value', function() {
    return get(this, 'value').length ?
      get(this, 'subHint') : get(this, 'config.defaultHint');
  }),

  hints: computed('value', 'adapter', function() {
    return get(this, 'adapter').getHints(get(this, 'value'), get(this, 'content')) || [];
  }),

  model: computed('value', 'isValueValid', 'adapter', {
    set(key, newModel) {
      let val = get(this, 'adapter').serialize(newModel);
      if (newModel.fullText || newModel.modifier) {
        set(this, 'fullText', val);
        return null;
      } else {
        set(this, 'value', val);
      }
      return newModel;
    },
    get() {
      if (get(this, 'isValueValid')) {
        return get(this, 'adapter')
          .deserialize(get(this, 'value'), get(this, 'content'));
      } else {
        return null;
      }
    }
  }),

  isValueValid: computed('value', 'adapter', function() {
    return get(this, 'adapter')
      .validate(get(this, 'value'), get(this, 'content'));
  }),

  autoComplete() {
    let hint = get(this, 'firstHint');
    let subHint = get(this, 'subHint');

    if (hint && subHint) {
      let hintValue = typeof hint === 'string' ? hint : hint.value;
      if (hint.modifier) {
        set(this, 'fullText', hintValue);
      } else {
        set(this, 'value', hintValue);
      }
      return true;
    }
    return false;
  }
});
