const fs = require('fs');

function processDataAndSaveToFile(jsonStrings, replacements, outputFilePath) {
    let processedData = jsonStrings.map(jsonString => {
        let data = JSON.parse(jsonString);

        // Remove key-value pairs where value is 0
        for (let bucket in data) {
            for (let key in data[bucket]) {
                if (data[bucket][key] === 0) {
                    delete data[bucket][key];
                }
            }
        }

        // Replace bucket keys based on replacements array
        for (let i = 0; i < replacements.length; i++) {
            let oldKey = replacements[i].old;
            let newKey = replacements[i].new;
            if (data[oldKey]) {
                data[newKey] = data[oldKey];
                delete data[oldKey];
            }
        }

        // Convert the processed data to a string with each bucket on a new line
        let resultString = '';
        for (let bucket in data) {
            resultString += `${bucket}: ${JSON.stringify(data[bucket])}\n`;
        }

        return resultString;
    }).join('\n'); // Separate each JSON string with an additional line break

    // Save the result to a text file
    fs.writeFileSync(outputFilePath, processedData);
}

async function formatAssignmentMessage() {
  // Example usage
  const jsonStrings = [
    `{"bucket_hn_1":{"pronto":179}}`,
    `{"bucket_do_1":{"coreval":489},"bucket_do_3":{"vertia":273}}`,
    `{"bucket_gt_5":{"avantte":427},"bucket_gt_6":{"avantte":342},"bucket_gt_1":{"admicarter":221,"recsa":0,"activagroup":148,"avantte":369,"lexcom":738},"bucket_gt_2":{"dinamicalegal":887,"recaguagt":0,"ovj":0,"vlrservicios":0,"tecserfin":0,"activagroup":0,"pcjsercon":0,"producnova":0},"bucket_gt_3":{"producnova":0,"vlrservicios":127,"tecserfin":0,"recaguagt":0,"ovj":211,"pcjsercon":84,"lexcom":0},"bucket_gt_4":{"itlumina":0,"contacto502":0,"serviciosestrategicos":480,"servicios_fey":0,"recsa":320},"bucket_gt_7":{"aserta":0,"corpocredit":1,"contacto502":0,"itlumina":0,"pronto":0}}`
  ];

  const replacements = [
    { old: 'bucket_gt_1', new: 'bucket_gt_91_180' },
    { old: 'bucket_gt_2', new: 'bucket_gt_181_210' },
    { old: 'bucket_gt_3', new: 'bucket_gt_211_360' },
    { old: 'bucket_gt_4', new: 'bucket_gt_361_510' },
    { old: 'bucket_gt_5', new: 'bucket_gt_31_60' },
    { old: 'bucket_gt_6', new: 'bucket_gt_61_90' },
    { old: 'bucket_gt_7', new: 'bucket_gt_511_600' },
    { old: 'bucket_gt_8', new: 'bucket_gt_+601' },
    { old: 'bucket_do_1', new: 'bucket_do_91_180' },
    { old: 'bucket_do_2', new: 'bucket_do_181_210' },
    { old: 'bucket_do_3', new: 'bucket_do_211_360' },
    { old: 'bucket_do_4', new: 'bucket_do_361_510' },
    { old: 'bucket_do_7', new: 'bucket_do_511_600' },
    { old: 'bucket_do_8', new: 'bucket_do_+601' },
    { old: 'bucket_hn_1', new: 'bucket_hn_91_180' },
    { old: 'bucket_hn_2', new: 'bucket_hn_181_210' },
    { old: 'bucket_hn_3', new: 'bucket_hn_211_360' },
    { old: 'bucket_hn_4', new: 'bucket_hn_361_510' },
    { old: 'bucket_hn_7', new: 'bucket_hn_511_600' },
    { old: 'bucket_hn_8', new: 'bucket_hn_+601' }
  ];

  const outputFilePath = 'format-collection-house-assignment-message.txt';

  processDataAndSaveToFile(jsonStrings, replacements, outputFilePath);
  //console.log(processedData);
}

module.exports.formatAssignmentMessage = formatAssignmentMessage;

