async function reloadTagsFromFile(filename) {
  const res = await fetch(filename);
  const data = await res.json();

  let groups = [];

  // --- キャラクターjsonのとき transformation配列で受け取る ---
  if (data.transformation && Array.isArray(data.transformation)) {
    groups = data.transformation;
  }
  // --- タグjsonのとき そのままgroup配列で受け取る ---
  else if (Array.isArray(data) && data[0]?.tags) {
    groups = data;
  } else {
    alert("対応していないファイル形式です。");
    document.getElementById('tag-container').innerHTML = '';
    document.getElementById('nsfw-tag-container').innerHTML = '';
    return;
  }

  // --- UIクリア ---
  document.getElementById('tag-container').innerHTML = '';
  document.getElementById('nsfw-tag-container').innerHTML = '';

  // --- UI生成 ---
  groups.forEach(group => {
    // グループタイトル
    if (group.group || group.label) {
      const groupHeader = document.createElement('div');
      groupHeader.innerHTML = `<b>${group.group || ""}${group.label ? "｜" + group.label : ""}</b>`;
      document.getElementById('tag-container').appendChild(groupHeader);
    }
    // タグリスト
    const tagBox = document.createElement('div');
    (group.tags || []).forEach(tag => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = tag.value;
      label.appendChild(input);
      label.append(` ${tag.label}`);
      tagBox.appendChild(label);
    });
    document.getElementById('tag-container').appendChild(tagBox);
  });

  updatePositivePrompt();
}
