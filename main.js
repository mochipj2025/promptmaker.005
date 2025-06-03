async function reloadTagsFromFile(filename) {
  const res = await fetch(filename);
  const data = await res.json();

  let groups = [];
  // --- キャラプロファイル型
  if (data.transformation && Array.isArray(data.transformation)) {
    groups = data.transformation;
  }
  // --- タグjson（1グループオブジェクト型）
  else if (data.group && data.tags && Array.isArray(data.tags)) {
    groups = [data];
  }
  // --- タグjson（配列型）
  else if (Array.isArray(data) && data[0]?.tags) {
    groups = data;
  }
  else {
    alert("未対応json型: " + JSON.stringify(data));
    document.getElementById('tag-container').innerHTML = '';
    document.getElementById('nsfw-tag-container').innerHTML = '';
    return;
  }

  document.getElementById('tag-container').innerHTML = '';
  document.getElementById('nsfw-tag-container').innerHTML = '';

  groups.forEach(group => {
    // 見出し
    const groupHeader = document.createElement('div');
    groupHeader.innerHTML = `<b>${group.group || ""}${group.label ? "｜" + group.label : ""}</b>`;
    document.getElementById('tag-container').appendChild(groupHeader);

    // タグ
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
