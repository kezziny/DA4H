import { Publisher } from './Publisher';
import each from 'jest-each';

jest.useFakeTimers();

describe('Publisher', () => {
  let source: Publisher<string> = null;
  let result: string = null;

  beforeEach(() => {
    source = new Publisher<string>();
    result = undefined;
  });

  it('publish', async () => {
    source.subscribe((i) => (result = i));

    source.publish('ok');

    expect(source.value).toBe('ok');
    expect(result).toBe('ok');
  });

  it('publish empty', async () => {
    source.onEmpty(() => (result = 'empty'));

    source.publish('prev');
    expect(source.value).toBe('prev');

    source.publish(undefined);

    expect(source.value).toBe(undefined);
    expect(result).toBe('empty');
  });

  it('publish error', async () => {
    source.onError((_) => (result = 'error'));

    source.publish('prev');
    expect(source.value).toBe('prev');

    source.publish(new Error());

    expect(source.value).toBe('prev');
    expect(result).toBe('error');
  });

  describe('switchIfEmpty', () => {
    each([
      ['const', false],
      ['function', true],
    ]).describe('argument - %s', (_, isFunction) => {
      let publisher = null;

      beforeEach(() => {
        if (isFunction) {
          publisher = source.switchIfEmpty(() => 'switched');
        } else {
          publisher = source.switchIfEmpty('switched');
        }
      });

      it('publish on parent', async () => {
        publisher.subscribe((i) => (result = i));

        source.publish('ok');

        expect(publisher.value).toBe('ok');
        expect(result).toBe('ok');
      });

      it('publish empty on parent', async () => {
        publisher.subscribe((i) => (result = i));

        source.publish(undefined);

        expect(publisher.value).toBe('switched');
        expect(result).toBe('switched');
      });

      it('publish error on parent', async () => {
        publisher.onError((_) => (result = 'error'));

        source.publish(new Error());

        expect(publisher.value).toBe(undefined);
        expect(result).toBe('error');
      });
    });
  });

  describe('changed', () => {
    let changed = null;
    let counter;

    beforeEach(() => {
      changed = source.changed();
      counter = 0;
    });

    it('publish on parent', async () => {
      changed.subscribe((_) => counter++);

      source.publish('ok');

      expect(changed.value).toBe('ok');
      expect(counter).toBe(1);

      source.publish('ok');

      expect(changed.value).toBe('ok');
      expect(counter).toBe(1);
    });

    it('publish empty on parent', async () => {
      changed.subscribe((_) => counter++);
      changed.onEmpty(() => (result = 'empty'));

      source.publish('ok');
      expect(changed.value).toBe('ok');
      expect(counter).toBe(1);

      source.publish(undefined);
      expect(changed.value).toBe(undefined);
      expect(result).toBe('empty');
      expect(counter).toBe(1);
    });

    it('publish error on parent', async () => {
      changed.subscribe((_) => counter++);
      changed.onError((_) => (result = 'error'));

      source.publish('ok');
      expect(changed.value).toBe('ok');
      expect(counter).toBe(1);

      source.publish(new Error());
      expect(changed.value).toBe('ok');
      expect(result).toBe('error');
      expect(counter).toBe(1);
    });
  });

  describe('map', () => {
    let publisher = null;

    beforeEach(() => {
      publisher = source.map((v) => v + v);
    });

    it('publish on parent', async () => {
      publisher.subscribe((i) => (result = i));

      source.publish('ok');

      expect(publisher.value).toBe('okok');
      expect(result).toBe('okok');
    });

    it('publish empty on parent', async () => {
      publisher.onEmpty(() => (result = 'empty'));

      source.publish('ok');
      expect(publisher.value).toBe('okok');

      source.publish(undefined);
      expect(publisher.value).toBe(undefined);
      expect(result).toBe('empty');
    });

    it('publish error on parent', async () => {
      publisher.onError((_) => (result = 'error'));

      source.publish('ok');
      expect(publisher.value).toBe('okok');

      source.publish(new Error());
      expect(publisher.value).toBe('okok');
      expect(result).toBe('error');
    });
  });

  describe('filter', () => {
    let publisher = null;

    beforeEach(() => {
      publisher = source.filter((v) => v === 'ok');
    });

    it('publish on parent', async () => {
      publisher.subscribe((i) => (result = i));

      source.publish('ok');

      expect(publisher.value).toBe('ok');
      expect(result).toBe('ok');

      source.publish('nok');

      expect(publisher.value).toBe('ok');
      expect(result).toBe('ok');
    });

    it('publish empty on parent', async () => {
      publisher.onEmpty(() => (result = 'empty'));

      source.publish('ok');
      expect(publisher.value).toBe('ok');

      source.publish(undefined);
      expect(publisher.value).toBe(undefined);
      expect(result).toBe('empty');
    });

    it('publish error on parent', async () => {
      publisher.onError((_) => (result = 'error'));

      source.publish('ok');
      expect(publisher.value).toBe('ok');

      source.publish(new Error());
      expect(publisher.value).toBe('ok');
      expect(result).toBe('error');
    });
  });

  describe('noPublishSince', () => {
    let publisher = null;

    beforeEach(() => {
      publisher = source.noPublishSince(100);
    });

    it('publish on parent', async () => {
      publisher.subscribe((i) => (result = i));

      source.publish('ok');
      expect(publisher.value).toBe(undefined);
      expect(result).toBe(undefined);

      jest.runAllTimers();
      expect(publisher.value).toBe('ok');
      expect(result).toBe('ok');
    });

    it('publish empty on parent', async () => {
      publisher.onEmpty(() => (result = 'empty'));

      source.publish(undefined);
      expect(publisher.value).toBe(undefined);
      expect(result).toBe('empty');
    });

    it('publish error on parent', async () => {
      publisher.onError((_) => (result = 'error'));

      source.publish('ok');
      expect(publisher.value).toBe(undefined);

      jest.runAllTimers();
      expect(publisher.value).toBe('ok');

      source.publish(new Error());
      expect(publisher.value).toBe('ok');
      expect(result).toBe('error');
    });
  });
});
