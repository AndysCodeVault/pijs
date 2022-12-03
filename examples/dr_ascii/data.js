"use strict";
var g = {
    "drAscii1": `
                          o_
                         /--\\ 
                       \\\\<" |
                        \\/  \\ 
                         |\\/|\\ 
                         \\  /\\ 
                         ||||
                        <=<=]
    `,
    "drAscii1Pills": [ [ 22, 6, "(" ], [ 23, 6, ")" ] ],
    "drAscii2": `
                          o_
                         /--\\
                         <" |
                         /  \\ 
                        /|\\/|\\
                        /\\  /\\
                         ||||
                        <=<=]
    `,
    "drAscii2Pills": [ [ 23, 9, "{" ], [ 23, 10, "}" ] ],
    "drAscii3": `
                          o_
                         /--\\
                         |''|
                         /' \\ 
                        /|\\/|\\
                        /\\  /\\
                         ||||
                        <=][=>
    `,
    "drAscii3Pills": [ [ 23, 9, "{" ], [ 23, 10, "}" ] ],
    "drAscii4": `
                          o_
                         /--\\
                         |\`\`|
                         / '\\ 
                        /|\\/|\\
                        /\\  /\\
                         ||||
                        <=][=>
    `,
    "drAscii4Pills": [ [ 23, 9, "{" ], [ 23, 10, "}" ] ],
    "drAscii5": `
                          o_
                         /--\\
                         |\`\`|
                         / '\\/ 
                        /|\\/|/
                        /\\  /
                         ||||
                        <=][=>
    `,
    "drAscii5Pills": [ [ 23, 9, "{" ], [ 23, 10, "}" ] ],
    "drAscii6": `
                          o_
                         /--\\
                         <" |
                       \\\\/  \\ 
                        \\|\\/|\\
                         \\  /\\
                         ||||
                        <=<=]
    `,
    "drAscii6Pills": [ [ 23, 6, "{" ], [ 23, 7, "}" ] ],
    "bottle": `


           ÉÍÍÍÍÍÍÍ»
           º       º
           ÈÍ»   ÉÍ¼
             º   º
             º   º
          ÉÍÍ¼   ÈÍÍ»
          º         º
          º         º
          º         º
          º         º
          º         º
          º         º
          º         º
          º         º
          º         º
          º         º
          º         º
          º         º
          º         º
          º         º
          º         º
          º         º
          º         º
          ÈÍÍÍÍÍÍÍÍÍ¼
    `,
    "bottle2": `


   ÉÍÍÍÍÍÍÍ»        ÉÍÍÍÍÍÍÍ»
   º       º        º       º
   ÈÍ»   ÉÍ¼        ÈÍ»   ÉÍ¼
     º   º            º   º  
     º   º            º   º  
  ÉÍÍ¼   ÈÍÍ»      ÉÍÍ¼   ÈÍÍ»
  º         º      º         º
  º         º      º         º
  º         º      º         º
  º         º      º         º
  º         º      º         º
  º         º      º         º
  º         º      º         º
  º         º      º         º
  º         º      º         º
  º         º      º         º
  º         º      º         º
  º         º      º         º
  º         º      º         º
  º         º      º         º
  º         º      º         º
  º         º      º         º
  º         º      º         º
  ÈÍÍÍÍÍÍÍÍÍ¼      ÈÍÍÍÍÍÍÍÍÍ¼
    `,
    "colors": [ 4, 54, 44 ],
    "screens": [],
    "top": localStorage.getItem( "top" ),
    "maxVirusLevel": 20,
    "speeds": [ 750, 450, 200 ],
    "speedNames": [ "LOW", "MED", "HIGH" ],
    "viruses": [ "~!", "#$", "%^" ],
    "pills": [ "(", ")", "{", "}" ],
    "rotations": [
        [  0,  0,  1,  0, "(", ")" ],
        [  0, -1,  0,  0, "{", "}" ],
        [  1,  0,  0,  0, ")", "(" ],
        [  0,  0,  0, -1, "}", "{" ]
    ],
    "animationDelay": 1000
};

g[ "animations" ] = [ g.drAscii2, g.drAscii3, g.drAscii4, g.drAscii5, g.drAscii6, g.drAscii1 ];
g[ "animationPills" ] = [ g.drAscii2Pills, g.drAscii3Pills, g.drAscii4Pills, g.drAscii5Pills, g.drAscii6Pills, g.drAscii1Pills ];

if( !g[ "top" ] ) {
  g[ "top" ] = 0;
}
