// Define transitions for Liquid-Fire
// http://ef4.github.io/liquid-fire/#/

const duration = 400;

export default function() {

  // Transition from index to a single talk
  this.transition(
    this.fromRoute('index'),
    this.toRoute('talk'),
    this.useAndReverse('explode', {
      matchBy: 'data-score-id',
      use: ['fly-to', { duration }]
    }, {
      matchBy: 'data-voting-id',
      use: ['fly-to', { duration }]
    }, {
      matchBy: 'data-title-id',
      use: ['fly-to', { duration }]
    }, {
      pickOld: '.event-list-item',
      matchBy: 'data-container-id',
      use: ['fly-to', { duration, movingSide: 'new' }]
    }, {
      pickNew: '.card',
      matchBy: 'data-container-id',
      use: ['fly-to', { duration, movingSide: 'new' }]
    }, {
      pickOld: '.container > .event-list-item',
      use: ['fade']
    })
  );

}

