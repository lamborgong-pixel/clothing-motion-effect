# 接入网站与维护衣服

## 只改一个配置文件

单品的唯一数据来源是 `clothes.config.js` 中的 `products`。页面不再读取 `assets/side/metadata.json`，也不需要维护任何按序号对应的图片数组。

- 编辑：修改对应条目的 `name`、`english`、`price`、`color`、`note`、`material`。
- 新增：在 `products` 数组中增加一条，`id` 必须唯一。
- 删除：删除整条商品对象；也可以设置 `enabled: false` 暂时隐藏。
- 排序：调整数组条目的前后顺序。
- 更换图片：将整个 `front` 或 `side` 改成新的图片路径字符串，自动重新测量；不要沿用旧图片的挂点和边界。
- 保存配置后刷新网页。发布到网站后也需要上传修改过的配置和新图片。

新增一件衣服的完整示例（图片文件需先放到对应位置）：

```js
{
  id: 'new-hoodie',
  name: '浅灰连帽卫衣',
  english: 'Grey Hooded Sweatshirt', // 可省略
  price: 399,                      // 数字；null 或省略表示价格待定
  color: '#c8c8c4',                 // 色点颜色；可省略
  note: '宽松廓形，轻松日常。',       // 可省略
  material: '连帽设计 · 宽松廓形',    // 可省略
  front: 'assets/new-hoodie.png',
  side: 'assets/side/new-hoodie.png'
},
```

`front`、`side` 可写相对路径或完整图片 URL。相对路径以 `clothes.config.js` 所在目录为准，整个组件移动到网站子目录后无需逐件改路径。

## 素材要求与自动挂点

使用真正带透明通道的 PNG 或 WebP，图片里保留木衣架和衣服，移除金属挂钩和挂杆。正面、侧面必须是同一件衣服，侧面需要真实的侧面视角。

默认从不透明像素计算边界，并用最上方 20 行可见像素的中心作为挂点。因此最上方可见部分应当是木衣架的颈部，而非袖子、挂钩或杂点；画布周围可以留透明空白。正面与侧面会等比缩放到相同的悬挂高度。

素材含旧金属挂钩或需要精调时，可以在同一个配置文件中手工指定**原图像素坐标**：

```js
front: {
  src: 'assets/my-shirt.png',
  hangPoint: { x: 512, y: 230 }, // 木衣架顶部：原图中的横坐标、纵坐标
  bounds: { left: 20, right: 1000, bottom: 1450 }
},
```

挂点以上区域会被裁掉，新的金属挂钩接在挂点上。`right`、`bottom` 是边界之外的第一个像素坐标。手工 `bounds` 可以省略，仅用 `hangPoint` 指定挂点，其余自动测量。已有 9 件素材的标定全部保存在配置文件中。

自动像素测量支持同源图片，或提供 CORS 访问的跨域图片。跨域图片如果不能提供 CORS 访问，可同时填写 `hangPoint` 与 `bounds`，跳过像素读取；图片本身仍需允许网站显示。

## 放进你的现有网站

推荐使用 iframe：组件 CSS 与 JavaScript 保持在自己的页面内，接入现有网站只需一段 HTML。

1. 把以下文件和图片上传到网站同一目录，例如 `/clothing/`：`index.html`、`styles.css`、`clothes.config.js`、`catalog.js`、`hardware.js`、`motion.js`、`app.js`、`assets/` 中配置引用的图片。
2. 在网站需要展示衣架的位置插入：

```html
<iframe
  src="/clothing/index.html?embed=1"
  title="服饰衣架展示"
  style="display:block;width:100%;height:680px;border:0;"
  loading="lazy"
></iframe>
```

`?embed=1` 隐藏演示页品牌栏和底部滚动文字，保留挂衣杆、单品选择和商品卡。iframe 高度可以按网站布局调整，建议至少 540px。需要完整演示页面时去掉 `?embed=1`。

通过 HTTP/HTTPS 访问；无需第三方框架、CDN 或构建步骤。

本项目的 `embed-example.html` 是可直接打开的嵌入示例，可以先在本地看效果再复制到网站中。

## 数量

商品数量、色点、挂钩、键盘切换和商品卡计数都会根据配置自动生成。增加条目后，静止间距会自动收紧以适应杆长；选中单品仍按实际边界向两侧让位。

为了保留清晰的侧面和宽松的交互空间，建议每排 8–9 件。配置没有固定件数上限，但大量同屏会重叠，图片数量也影响加载速度；自动收紧不会让无限多衣服都清晰可选。
