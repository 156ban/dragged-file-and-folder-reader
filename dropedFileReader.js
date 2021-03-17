function readDirectory(directory) {
  return new Promise((resolve, reject) => {
    const dirReader = directory.createReader();
    let entries = [];

    const getEntries = function() {
      dirReader.readEntries(
        function(results) {
          if (results.length) {
            entries = entries.concat(results);
            getEntries();
          } else {
            resolve(entries);
          }
        },
        function(error) {
          reject(error);
        }
      );
    };

    getEntries();
  });
}

async function readRoll(arr) {
  for (let key in arr) {
    if (arr[key].isDirectory) {
      let result = await readDirectory(arr[key]);
      arr[key] = result;
      await readRoll(result);
    }
  }
}

function readFileEntry(fileEntry) {
  return new Promise((resolve, reject) => {
    fileEntry.file(
      (fileData) => {
        fileData.fullPath = fileEntry.fullPath;
        resolve(fileData);
      },
      (error) => {
        reject(error);
      }
    );
  });
}

export async function dropedFileReader(event) {
  if (!event.dataTransfer || !event.dataTransfer.items) {
    this.uploadLoading = false;
    throw new Error();
  }

  let fileEntryList = [];

  for (let item of event.dataTransfer.items) {
    fileEntryList.push(item.webkitGetAsEntry());
  }

  await readRoll(fileEntryList);

  fileEntryList = fileEntryList.flat(Infinity);

  const fileList = [];

  for (let item of fileEntryList) {
    let fileData = await readFileEntry(item);
    fileList.push(fileData);
  }

  return fileList;
}
