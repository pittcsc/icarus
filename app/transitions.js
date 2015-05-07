// Define transitions for Liquid-Fire
// http://ef4.github.io/liquid-fire/#/

export default function() {

  // Transition from index to a single talk
  this.transition(
    this.fromRoute('index'),
    this.toRoute('talks/talk'),
    this.use('toLeft')
  );

}

