export default class Message {
  constructor(options) {
    options = JSON.parse(options);
    this.id = options.id;
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
