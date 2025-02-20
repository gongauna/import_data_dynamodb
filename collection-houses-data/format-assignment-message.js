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
    `{"bucket_hn_1":{"pronto":143,"css":143},"bucket_hn_1_2nd":{"pronto":204,"css":204},"bucket_hn_3_2nd":{"controles_gerenciales":1}}`,
    `{"bucket_do_5":{"coreval":510},"bucket_do_1":{"coreval":342,"iungo":342},"bucket_do_1_2nd":{"coreval":661,"iungo":661},"bucket_do_3":{"vertia":491,"templarisdo":0}}`,
    `{"bucket_gt_5":{"avantte":677,"fraud_investigation":0},"bucket_gt_1":{"admicarter":160,"activagroup":0,"avantte":191,"lexcom":191,"pcjsercon":0,"fraud_investigation":0,"serviciosestrategicos":96},"bucket_gt_1_2nd":{"admicarter":310,"activagroup":0,"avantte":372,"lexcom":372,"pcjsercon":0,"fraud_investigation":0,"serviciosestrategicos":186},"bucket_gt_3":{"producnova":98,"vlrservicios":0,"tecserfin":0,"recaguagt":49,"ovj":0,"pcjsercon":0,"lexcom":0,"fyg_cobros_efectivos":49,"recart":0,"cardicobros":49,"activagroup":98,"dinamicalegal":148},"bucket_gt_3_2nd":{"producnova":106,"vlrservicios":0,"tecserfin":0,"recaguagt":53,"ovj":0,"pcjsercon":0,"lexcom":0,"fyg_cobros_efectivos":53,"recart":0,"cardicobros":53,"activagroup":106,"dinamicalegal":158},"bucket_gt_4":{"itlumina":0,"contacto502":0,"serviciosestrategicos":5,"servicios_fey":0,"recsa":0,"soluciones_globales":5,"pcjsercon":0,"recart":0},"bucket_gt_4_2nd":{"itlumina":0,"contacto502":0,"serviciosestrategicos":45,"soluciones_globales":45,"servicios_fey":0,"recsa":0},"bucket_gt_7":{"aserta":0,"pcjsercon":0,"corpocredit":0,"contacto502":0,"itlumina":17,"pronto":0,"gestion_servicios_integrados":0,"recart":0,"recsa":17},"bucket_gt_7_2nd":{"aserta":0,"pcjsercon":0,"corpocredit":0,"contacto502":0,"itlumina":30,"pronto":0,"gestion_servicios_integrados":0,"recart":0,"recsa":30},"bucket_gt_8":{"aserta":0,"aserta_demandas":0,"bolson":0,"negociaree":0,"audepaz":0,"vana_fraud":0,"venta1corpocredit":0,"itlumina":0,"contacto502":0,"pronto":0,"recart":0,"gestion_servicios_integrados":2108,"corpocredit":0},"bucket_gt_8_2nd":{"aserta":0,"aserta_demandas":0,"bolson":0,"negociaree":0,"audepaz":0,"vana_fraud":0,"venta1corpocredit":0,"itlumina":0,"contacto502":0,"pronto":0,"recart":0,"gestion_servicios_integrados":93,"corpocredit":0}}`
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

