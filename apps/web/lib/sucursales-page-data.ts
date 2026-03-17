// PATH: apps/web/lib/sucursales-page-data.ts
// DESC: Datos para la página /sucursales — 5 sucursales y 8 tótems con coordenadas en el mapa SVG (viewBox 0 0 760 540)

export type SucursalMap = {
  name: string;
  addr: string;
  hours: string;
  contact: string;
  map: string;
  phone?: string;
  img: string;
  totem: boolean;
  open: boolean;
  x: number;
  y: number;
};

export type TotemMap = {
  name: string;
  addr: string;
  hours: string;
  map: string;
  img: string;
  is24: boolean;
  x: number;
  y: number;
};

export const SUC_MAP: SucursalMap[] = [
  {
    name: 'Casa Central San Sebastián',
    addr: 'San Sebastián 2814, Las Condes',
    hours: 'Lun–Vie 8:30–18:00 · Sáb 9:00–14:00',
    contact: '+569 8894 6178',
    map: 'https://goo.gl/maps/UQvXSJofkH9oLMiZ6',
    phone: '+56988946178',
    img: 'https://www.moreexchange.cl/wp-content/uploads/2023/06/sansebastian-1.jpg',
    totem: true,
    open: true,
    x: 530,
    y: 130,
  },
  {
    name: 'El Bosque Norte',
    addr: 'El Bosque Norte 091, Las Condes',
    hours: 'Lun–Vie 8:30–17:30 · Sáb 9:30–16:00',
    contact: '+569 8894 6019',
    map: 'https://goo.gl/maps/frXGSmYGPWMBGNN6A',
    phone: '+56988946019',
    img: 'https://www.moreexchange.cl/wp-content/uploads/2023/06/elbosque.jpg',
    totem: false,
    open: true,
    x: 490,
    y: 175,
  },
  {
    name: 'Providencia · Suecia',
    addr: 'Suecia 13 – Local 5, Providencia',
    hours: 'Lun–Vie 9:00–18:00 · Sáb 10:00–17:00',
    contact: '+569 7299 7623',
    map: 'https://goo.gl/maps/u4BCj18ANKVCEWW79',
    phone: '+56972997623',
    img: 'https://www.moreexchange.cl/wp-content/uploads/2023/06/suecia.jpg',
    totem: true,
    open: true,
    x: 330,
    y: 370,
  },
  {
    name: 'Patronato · Recoleta',
    addr: 'Asunción 402, Recoleta',
    hours: 'Lun–Vie 9:30–18:00 · Sáb 10:00–16:00',
    contact: '+569 8894 9942',
    map: 'https://goo.gl/maps/eLEyXiiSbxgydBWj6',
    phone: '+56988949942',
    img: 'https://www.moreexchange.cl/wp-content/uploads/2023/06/patronato.jpg',
    totem: false,
    open: true,
    x: 270,
    y: 355,
  },
  {
    name: 'Mall Parque Arauco',
    addr: 'Av. Pdte. Kennedy 5413, Piso 1',
    hours: 'Lun–Sáb 10:00–20:00 · Dom 11:00–20:00',
    contact: '+569 8894 9233',
    map: 'https://maps.app.goo.gl/Bnyx6LZP1LqxSwvu7',
    phone: '+56988949233',
    img: 'https://www.moreexchange.cl/wp-content/uploads/2023/10/PQARAUCOBRANDEADO.jpg',
    totem: false,
    open: true,
    x: 568,
    y: 100,
  },
];

export const TOT_MAP: TotemMap[] = [
  {
    name: 'Costanera Center',
    addr: 'Av. Andrés Bello 2425 · 1er y 2do piso',
    hours: 'Lun–Dom 10:00–21:00',
    map: 'https://goo.gl/maps/dapK24pFjPEhVX2g6',
    img: 'https://www.moreexchange.cl/wp-content/uploads/2023/06/costanera2.jpg',
    is24: false,
    x: 370,
    y: 415,
  },
  {
    name: 'Alto Las Condes',
    addr: 'Av. Pdte. Kennedy Lateral · Frente a Privilege',
    hours: 'Según horario de Mall',
    map: 'https://goo.gl/maps/qTrJa1NaX5jmiuer5',
    img: 'https://www.moreexchange.cl/wp-content/uploads/2023/06/alto.jpg',
    is24: false,
    x: 600,
    y: 125,
  },
  {
    name: 'Portal La Dehesa',
    addr: 'Av. La Dehesa 1445, Lo Barnechea',
    hours: 'Lun–Sáb 8:00–21:00 · Dom 9:00–21:00',
    map: 'https://goo.gl/maps/FYcHwM7zDgN9L4aW7',
    img: 'https://www.moreexchange.cl/wp-content/uploads/2023/06/ladehesa.jpg',
    is24: false,
    x: 680,
    y: 80,
  },
  {
    name: 'Parque Arauco · Tótem',
    addr: 'Av. Pdte. Kennedy 5413 · Salida Paris 1er piso',
    hours: 'Según horario de Mall',
    map: 'https://goo.gl/maps/TR5DXbe36FFS6XwM6',
    img: 'https://www.moreexchange.cl/wp-content/uploads/2023/06/parquearauco.jpg',
    is24: false,
    x: 545,
    y: 108,
  },
  {
    name: 'Portal Ñuñoa',
    addr: 'Av. José Pedro Alessandri 1166 · Piso 2',
    hours: 'Según horario de Mall',
    map: 'https://maps.app.goo.gl/Z4Shv5KxTcjgv6oq6',
    img: 'https://www.moreexchange.cl/wp-content/uploads/2023/11/nunoa.jpg',
    is24: false,
    x: 420,
    y: 430,
  },
  {
    name: 'Suecia 24/7',
    addr: 'Suecia 13 – Local 5, Providencia',
    hours: '24 horas · 7 días',
    map: 'https://maps.app.goo.gl/1NkLrobZ1jraNfKd9',
    img: 'https://www.moreexchange.cl/wp-content/uploads/2025/11/suecia.jpg',
    is24: true,
    x: 310,
    y: 385,
  },
  {
    name: 'Patio Bellavista',
    addr: 'Constitución 50, Providencia',
    hours: 'Dom–Mar 10:00–01:00 · Jue–Sáb 10:00–03:00',
    map: 'https://maps.app.goo.gl/Bnyx6LZP1LqxSwvu7',
    img: 'https://www.moreexchange.cl/wp-content/uploads/2025/11/patio-bellavista.jpg',
    is24: false,
    x: 288,
    y: 390,
  },
  {
    name: 'Plaza Egaña',
    addr: 'Frente a Tottus · Salida del Metro',
    hours: 'Según horario de Mall',
    map: 'https://maps.app.goo.gl/4dmzz9Xw5xxNwt5CA',
    img: 'https://www.moreexchange.cl/wp-content/uploads/2025/03/egana-1.jpg',
    is24: false,
    x: 460,
    y: 450,
  },
];
