import { Event } from './event.entity';

describe('Event entity tests', () => {
  it('should initialize event correctly', () => {
    const name = 'event name';
    const description = 'event description';
    const event = new Event({
      name,
      description,
    });

    expect(event.name).toBe(name);
    expect(event.description).toBe(description);
    expect(event.address).toBeUndefined();
    expect(event.organizer).toBeUndefined();
    expect(event.when).toBeUndefined();
  });
});
