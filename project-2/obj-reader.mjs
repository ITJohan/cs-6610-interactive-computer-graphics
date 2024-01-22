const fileReader = new FileReader();
fileReader.addEventListener('load', (e) => {
  const result = e.target.result;
  console.log(result);
});

const inputEl = document.querySelector('input');
inputEl.addEventListener('change', (e) =>
  fileReader.readAsText(e.target.files[0])
);
