window?.addEventListener?.('load', () => {
  const themeColorDom = document.getElementById('themeColor');
  const colorful = ["red", "pink", "green", "blue", "orange"];

  document?.body?.addEventListener?.("click", () => {
    const [_, oldHref, oldColor] = themeColorDom?.href?.match(/^(.*)\/(.*)\.css$/);

    const newColorI = parseInt(Math.random() * colorful.length);
    const newColor = colorful[newColorI] === oldColor ?
      colorful[(newColorI + 1) % colorful.length]:
      colorful[newColorI ?? 0];

    themeColorDom.href = `${oldHref}/${newColor}.css`;
  });
});
