import { animate, group, query, style, transition, trigger } from '@angular/animations';

export const fader = trigger('routeAnimations', [
  transition('* <=> *', [
    group([
      // Set a default  style for enter and leave
      query(
        ':enter, :leave',
        [
          style({
            position: 'absolute',
            left: 0,
            width: '100%',
            opacity: 0,
          }),
        ],
        { optional: true }
      ),
      query(
        ':enter',
        [
          style({
            transform: 'translateY(66%)',
          }),
          animate(
            '400ms cubic-bezier(.89,-0.61,.66,.99)',
            style({ opacity: 1, transform: 'translateY(0)' })
          ),
        ],
        { optional: true }
      ),
    ]),
  ]),
]);
