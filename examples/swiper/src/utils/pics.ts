import pic1 from '../assets/1.png';
import pic2 from '../assets/2.png';
import pic3 from '../assets/3.png';
import pic4 from '../assets/4.png';
import pic5 from '../assets/5.png';
import pic6 from '../assets/6.png';
import pic7 from '../assets/7.png';
import pic8 from '../assets/8.png';

export const pics = [
  { src: pic1, width: '511px', height: '437px' },
  { src: pic2, width: '1024px', height: '1589px' },
  { src: pic3, width: '510px', height: '418px' },
  { src: pic4, width: '509px', height: '438px' },
  { src: pic5, width: '1024px', height: '1557px' },
  { src: pic6, width: '509px', height: '415px' },
  { src: pic7, width: '509px', height: '426px' },
  { src: pic8, width: '1024px', height: '1544px' },
];

export const picsArr = pics.slice(0, 8).map((pic) => pic.src);
