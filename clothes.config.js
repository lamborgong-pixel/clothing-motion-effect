/* 衣服的增删、排序、编辑只修改这个文件。
 * 新增：复制一条商品，设置唯一 id、名称、价格、颜色和正侧图片路径。
 * 删除：删除整条商品；暂时隐藏：加 enabled: false；排序：移动条目位置。
 * 新的透明素材可直接写 front: "assets/new-front.png", side: "assets/side/new-side.png"。
 * 自动挂点要求：图片没有金属挂钩，最上方可见部分是木衣架颈部。
 * 下方现有素材有手工标定。更换图片时，可把整个 front/side 对象改成路径字符串，启用自动标定。
 * price: null 表示价格待定；文本不需要的字段可省略 english/note/material。
 */
window.KNIT_RAIL_CONFIG = {
  // 路径相对于本配置文件所在目录；放进网站子目录后不用改这里。
  baseURL: new URL('.', document.currentScript.src).href,
  products: [
    {
      id: 'berry-polo',
      name: '莓粉针织 Polo', english: 'Berry Knit Polo',
      price: 369, color: '#cf8d9e',
      note: '一点温柔的莓粉，为日常添一点好心情。',
      front: {
        src: 'assets/berry-polo.png',
        hangPoint: {x: 508, y: 229},
        bounds: {left: 21, right: 1004, bottom: 1455}
      },
      side: {
        src: 'assets/side/berry-polo.png',
        hangPoint: {x: 510.2, y: 17},
        bounds: {left: 328, right: 744, bottom: 1490}
      }
    },
    {
      id: 'oat-polo',
      name: '燕麦针织 Polo', english: 'Oat Knit Polo',
      price: 369, color: '#a79a87',
      note: '自然的燕麦色，让每一次搭配都从容。',
      front: {
        src: 'assets/oat-polo.png',
        hangPoint: {x: 515, y: 260},
        bounds: {left: 23, right: 1002, bottom: 1419}
      },
      side: {
        src: 'assets/side/oat-polo.png',
        hangPoint: {x: 515.33, y: 31},
        bounds: {left: 331, right: 699, bottom: 1485}
      }
    },
    {
      id: 'blue-polo',
      name: '海蓝针织 Polo', english: 'Blue Knit Polo',
      price: 369, color: '#699bc2',
      note: '把晴日里的海风，穿进柔软的针织。',
      front: {
        src: 'assets/blue-polo.png',
        hangPoint: {x: 513, y: 212},
        bounds: {left: 13, right: 1012, bottom: 1467}
      },
      side: {
        src: 'assets/side/blue-polo.png',
        hangPoint: {x: 515.57, y: 35},
        bounds: {left: 329, right: 735, bottom: 1458}
      }
    },
    {
      id: 'butter-polo',
      name: '奶油针织 Polo', english: 'Butter Knit Polo',
      price: 369, color: '#e8d99b',
      note: '淡淡奶油黄，是穿在身上的一束阳光。',
      front: {
        src: 'assets/butter-polo.png',
        hangPoint: {x: 516, y: 233},
        bounds: {left: 23, right: 1002, bottom: 1403}
      },
      side: {
        src: 'assets/side/butter-polo.png',
        hangPoint: {x: 520.7, y: 13},
        bounds: {left: 320, right: 697, bottom: 1496}
      }
    },
    {
      id: 'cloud-sweater',
      name: '云白圆领针织', english: 'Cloud Knit Sweater',
      price: 429, color: '#e6e2d5',
      note: '干净的云白与松弛廓形，留住生活的轻盈。',
      front: {
        src: 'assets/cloud-sweater.png',
        hangPoint: {x: 518, y: 199},
        bounds: {left: 30, right: 991, bottom: 1442}
      },
      side: {
        src: 'assets/side/cloud-sweater.png',
        hangPoint: {x: 514.5, y: 7},
        bounds: {left: 324, right: 699, bottom: 1511}
      }
    },
    {
      id: 'pistachio-sweater',
      name: '开心果圆领针织', english: 'Pistachio Knit Sweater',
      price: 429, color: '#c8ce9b',
      note: '清新的开心果绿，让日常多一份自在。',
      front: {
        src: 'assets/pistachio-sweater.png',
        hangPoint: {x: 508, y: 216},
        bounds: {left: 13, right: 1010, bottom: 1468}
      },
      side: {
        src: 'assets/side/pistachio-sweater.png',
        hangPoint: {x: 517.98, y: 28},
        bounds: {left: 352, right: 686, bottom: 1511}
      }
    },
    {
      id: 'apricot-polo',
      name: '杏桃针织 Polo', english: 'Apricot Knit Polo',
      price: 369, color: '#dcae88',
      note: '柔和杏桃色，像午后的阳光一样温暖。',
      front: {
        src: 'assets/apricot-polo.png',
        hangPoint: {x: 512, y: 231},
        bounds: {left: 12, right: 1012, bottom: 1397}
      },
      side: {
        src: 'assets/side/apricot-polo.png',
        hangPoint: {x: 514.16, y: 11},
        bounds: {left: 318, right: 719, bottom: 1467}
      }
    },
    {
      id: 'stone-sweater',
      name: '岩灰圆领针织', english: 'Stone Knit Sweater',
      price: 429, color: '#989e99',
      note: '克制的岩灰，在柔软与利落之间找到平衡。',
      front: {
        src: 'assets/stone-sweater.png',
        hangPoint: {x: 505, y: 191},
        bounds: {left: 19, right: 1006, bottom: 1442}
      },
      side: {
        src: 'assets/side/stone-sweater.png',
        hangPoint: {x: 507.34, y: 15},
        bounds: {left: 360, right: 701, bottom: 1482}
      }
    },
    {
      id: 'cream-hoodie',
      name: '奶油色连帽卫衣', english: 'Cream Hooded Sweatshirt',
      price: null, color: '#e5d8bc',
      note: '奶油色连帽卫衣，抽绳与袋鼠口袋，让宽松日常更自在。',
      material: '连帽设计 · 袋鼠口袋 · 宽松廓形',
      front: {
        src: 'assets/cream-hoodie.png',
        hangPoint: {x: 615.52, y: 39},
        bounds: {left: 23, right: 1210, bottom: 1188}
      },
      side: {
        src: 'assets/side/cream-hoodie.png',
        hangPoint: {x: 499.95, y: 54},
        bounds: {left: 285, right: 738, bottom: 1393}
      }
    }
  ]
};
