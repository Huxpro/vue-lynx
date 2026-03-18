import pic0 from './furnitures/0.png';
import pic1 from './furnitures/1.png';
import pic10 from './furnitures/10.png';
import pic11 from './furnitures/11.png';
import pic12 from './furnitures/12.png';
import pic13 from './furnitures/13.png';
import pic14 from './furnitures/14.png';
import pic2 from './furnitures/2.png';
import pic3 from './furnitures/3.png';
import pic4 from './furnitures/4.png';
import pic5 from './furnitures/5.png';
import pic6 from './furnitures/6.png';
import pic7 from './furnitures/7.png';
import pic8 from './furnitures/8.png';
import pic9 from './furnitures/9.png';

export interface Picture {
  src: string;
  width: number;
  height: number;
}

export const furnituresPicturesSubArray: Picture[] = [
  { src: pic0, width: '512px', height: '429px' },
  { src: pic1, width: '511px', height: '437px' },
  { src: pic2, width: '1024px', height: '1589px' },
  { src: pic3, width: '510px', height: '418px' },
  { src: pic4, width: '509px', height: '438px' },
  { src: pic5, width: '1024px', height: '1557px' },
  { src: pic6, width: '509px', height: '415px' },
  { src: pic7, width: '509px', height: '426px' },
  { src: pic8, width: '1024px', height: '1544px' },
  { src: pic9, width: '510px', height: '432px' },
  { src: pic10, width: '1024px', height: '1467px' },
  { src: pic11, width: '1024px', height: '1545px' },
  { src: pic12, width: '512px', height: '416px' },
  { src: pic13, width: '1024px', height: '1509px' },
  { src: pic14, width: '512px', height: '411px' },
];

export const furnituresPictures: Picture[] = [
  ...furnituresPicturesSubArray,
  ...furnituresPicturesSubArray,
  ...furnituresPicturesSubArray,
  ...furnituresPicturesSubArray,
  ...furnituresPicturesSubArray,
];
