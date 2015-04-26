export default class Message {
  constructor(options) {
    if (typeof options === 'string') {
      options = JSON.parse(options);
    }
    this.id = parseInt(options.id);
    this.type = options.type;
    this.body = options.body;
  }

  toJSON() {
    const json = {
      id: this.id,
      type: this.type,
      body: this.body
    };
    return JSON.stringify(json);
  }
}
