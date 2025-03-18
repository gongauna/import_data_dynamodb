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
    `{"bucket_hn_1":{"pronto":115,"css":115},"bucket_hn_1_2nd":{"pronto":172,"css":172},"bucket_hn_3":{"controles_gerenciales":112},"bucket_hn_3_2nd":{"controles_gerenciales":170}}`,
    `{"bucket_do_5":{"coreval":393},"bucket_do_6":{"coreval":3},"bucket_do_1":{"coreval":346,"iungo":346},"bucket_do_1_2nd":{"coreval":465,"iungo":465},"bucket_do_3":{"vertia":663,"templarisdo":0},"bucket_do_7":{"vertia":1,"templarisdo":0},"bucket_do_8":{"vertia":2,"templarisdo":0,"bolsondo":0}}`,
    `{"bucket_gt_5":{"avantte":534,"fraud_investigation":0},"bucket_gt_1":{"admicarter":173,"activagroup":0,"avantte":208,"lexcom":208,"pcjsercon":0,"fraud_investigation":0,"serviciosestrategicos":104},"bucket_gt_1_2nd":{"admicarter":172,"activagroup":0,"avantte":206,"lexcom":206,"pcjsercon":0,"fraud_investigation":0,"serviciosestrategicos":103},"bucket_gt_3":{"producnova":184,"vlrservicios":0,"tecserfin":0,"recaguagt":92,"ovj":0,"pcjsercon":0,"lexcom":0,"fyg_cobros_efectivos":92,"recart":0,"cardicobros":92,"activagroup":184,"dinamicalegal":275},"bucket_gt_3_2nd":{"producnova":137,"vlrservicios":0,"tecserfin":0,"recaguagt":69,"ovj":0,"pcjsercon":0,"lexcom":0,"fyg_cobros_efectivos":69,"recart":0,"cardicobros":69,"activagroup":137,"dinamicalegal":206},"bucket_gt_4":{"itlumina":0,"contacto502":0,"serviciosestrategicos":249,"servicios_fey":0,"recsa":0,"soluciones_globales":249,"pcjsercon":0,"recart":0},"bucket_gt_4_2nd":{"itlumina":0,"contacto502":0,"serviciosestrategicos":263,"soluciones_globales":263,"servicios_fey":0,"recsa":0},"bucket_gt_7":{"aserta":0,"pcjsercon":0,"corpocredit":0,"contacto502":0,"itlumina":80,"pronto":0,"gestion_servicios_integrados":0,"recart":0,"recsa":80},"bucket_gt_7_2nd":{"aserta":0,"pcjsercon":0,"corpocredit":0,"contacto502":0,"itlumina":100,"pronto":0,"gestion_servicios_integrados":0,"recart":0,"recsa":100},"bucket_gt_8":{"aserta":0,"aserta_demandas":0,"bolson":0,"negociaree":0,"audepaz":0,"vana_fraud":0,"venta1corpocredit":0,"itlumina":0,"contacto502":0,"pronto":0,"recart":0,"gestion_servicios_integrados":147,"corpocredit":0},"bucket_gt_8_2nd":{"aserta":0,"aserta_demandas":0,"bolson":0,"negociaree":0,"audepaz":0,"vana_fraud":0,"venta1corpocredit":0,"itlumina":0,"contacto502":0,"pronto":0,"recart":0,"gestion_servicios_integrados":138,"corpocredit":0}}`
  ];

  const replacements = [
    { old: 'bucket_gt_1', new: 'bucket_gt_91_210' },
    { old: 'bucket_gt_2', new: 'bucket_gt_181_210' },
    { old: 'bucket_gt_3', new: 'bucket_gt_211_360' },
    { old: 'bucket_gt_4', new: 'bucket_gt_361_510' },
    { old: 'bucket_gt_5', new: 'bucket_gt_31_60' },
    { old: 'bucket_gt_6', new: 'bucket_gt_61_90' },
    { old: 'bucket_gt_7', new: 'bucket_gt_511_600' },
    { old: 'bucket_gt_8', new: 'bucket_gt_+601' },
    { old: 'bucket_gt_1_2nd', new: 'bucket_gt_91_210_2nd_plus' },
    { old: 'bucket_gt_2_2nd', new: 'bucket_gt_181_210_2nd_plus' },
    { old: 'bucket_gt_3_2nd', new: 'bucket_gt_211_360_2nd_plus' },
    { old: 'bucket_gt_4_2nd', new: 'bucket_gt_361_510_2nd_plus' },
    { old: 'bucket_gt_5_2nd', new: 'bucket_gt_31_60_2nd_plus' },
    { old: 'bucket_gt_6_2nd', new: 'bucket_gt_61_90_2nd_plus' },
    { old: 'bucket_gt_7_2nd', new: 'bucket_gt_511_600_2nd_plus' },
    { old: 'bucket_gt_8_2nd', new: 'bucket_gt_+601_2nd_plus' },
    { old: 'bucket_do_5', new: 'bucket_do_31_60' },
    { old: 'bucket_do_6', new: 'bucket_do_61_90' },
    { old: 'bucket_do_9', new: 'bucket_do_61_90' },
    { old: 'bucket_do_1', new: 'bucket_do_91_210' },
    { old: 'bucket_do_1_2nd', new: 'bucket_do_91_210_2nd_plus' },
    { old: 'bucket_do_2', new: 'bucket_do_181_210' },
    { old: 'bucket_do_2_2nd', new: 'bucket_do_181_210_2nd_plus' },
    { old: 'bucket_do_3', new: 'bucket_do_211_360' },
    { old: 'bucket_do_4', new: 'bucket_do_361_510' },
    { old: 'bucket_do_7', new: 'bucket_do_511_600' },
    { old: 'bucket_do_8', new: 'bucket_do_+601' },
    { old: 'bucket_hn_1', new: 'bucket_hn_91_210' },
    { old: 'bucket_hn_2', new: 'bucket_hn_181_210' },
    { old: 'bucket_hn_3', new: 'bucket_hn_211_360' },
    { old: 'bucket_hn_4', new: 'bucket_hn_361_510' },
    { old: 'bucket_hn_7', new: 'bucket_hn_511_600' },
    { old: 'bucket_hn_8', new: 'bucket_hn_+601' },
    { old: 'bucket_hn_1_2nd', new: 'bucket_hn_91_210_2nd_plus' },
    { old: 'bucket_hn_3_2nd', new: 'bucket_hn_211_360_2nd_plus' },
    { old: 'bucket_hn_4_2nd', new: 'bucket_hn_361_510_2nd_plus' },
    { old: 'bucket_hn_7_2nd', new: 'bucket_hn_511_600_2nd_plus' },
    { old: 'bucket_hn_8_2nd', new: 'bucket_hn_+601_2nd_plus' }
  ];

  const outputFilePath = 'format-collection-house-assignment-message.txt';

  processDataAndSaveToFile(jsonStrings, replacements, outputFilePath);
  //console.log(processedData);
}

module.exports.formatAssignmentMessage = formatAssignmentMessage;

