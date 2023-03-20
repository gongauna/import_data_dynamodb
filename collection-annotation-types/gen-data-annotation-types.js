const readXlsxFile = require('read-excel-file/node')
const fs = require('fs');
const { 
  v4: uuidv4,
} = require('uuid');

function generateAnnotationTypes() {
const annotationTypesSchema = {
    'short': {
      prop: 'short',
      type: String
    },
    'name': {
      prop: 'name',
      type: String
    },
    'permission': {
      prop: 'permission',
      type: (value) => {
        const arrayPermission = value.split(',');
        if (!arrayPermission) {
          return null;
        }

        const arrayObjectPermission = arrayPermission.map((perm) => {
          return {
            S: perm.trim()
          }
        })
        return arrayObjectPermission;
      }
    }
}

const annotationTagsSchema = {
  'name': {
    prop: 'name',
    type: String
  },
  'type': {
    prop: 'type',
    type: String
  }
}

readXlsxFile('./data-annotation-types.xlsx', {schema: annotationTagsSchema, sheet: 'tags'}).then((rows) => {
  const arraysAnnotationTypesTags = rows.rows;

  readXlsxFile('./data-annotation-types.xlsx', { schema: annotationTypesSchema, sheet: 'types'}).then((rows) => {
    const arrayTypes = rows.rows;

    const jsonAnnotationTypesArray = []
    arrayTypes.forEach((type) => {
      const tagsTypeNames = arraysAnnotationTypesTags.filter((tag) => tag.type === type.short).map((tag) => tag.name);

      let objectPush;
      if (tagsTypeNames.length > 0) {
        objectPush = {
            PutRequest: {
              Item: {
                id: {S: uuidv4()},
                tags: {
                  SS: tagsTypeNames 
                },
                short: {
                  S: type.short
                },
                name: {
                  S: type.name
                },
                status: {
                  S: "enabled"
                },
                created_at: {
                  S: new Date().toISOString()
                },
              }
            }
        };
      } else {
        objectPush = {
            PutRequest: {
              Item: {
                id: {S: uuidv4()},
                short: {
                  S: type.short
                },
                name: {
                  S: type.name
                },
                status: {
                  S: "enabled"
                },
                created_at: {
                  S: new Date().toISOString()
                },
              }
            }
        };
      }
      jsonAnnotationTypesArray.push(objectPush);
    });

    const cantRequest = 24;
    const cantFiles = Math.ceil(jsonAnnotationTypesArray.length / cantRequest);

    for (let r=0; r< cantFiles; r++) {
      const startRow = r*cantRequest;  
      const endRow = (r+1)*cantRequest;
      const filtered = jsonAnnotationTypesArray.filter((row) => jsonAnnotationTypesArray.indexOf(row) >= startRow && jsonAnnotationTypesArray.indexOf(row) < endRow);
      let collectionAnnotationTypesJson = {
        collection_annotation_type_dev: filtered
      };
      fs.writeFile(`./files_to_import/annotation_types_dev_${r}.json`,JSON.stringify(collectionAnnotationTypesJson),"utf8", function (err) {
          if (err) {
            console.log("Error"+err);
          }
          console.log(`Annotation-types ${r} JSON file saved`);
      })
    }
})
});
}

module.exports.generateAnnotationTypes = generateAnnotationTypes;

