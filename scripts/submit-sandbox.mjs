import crypto from 'node:crypto';

const {
  CLIENT_ID,
  CLIENT_SECRET,
  API_BASE = 'https://preprod-api.myinvois.hasil.gov.my',
} = process.env;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing CLIENT_ID or CLIENT_SECRET in env');
  process.exit(1);
}

// ---- UBL Helpers (exact match ublBuilder.ts) ----
const w = (value, attrs = {}) => [{ _: value, ...attrs }];
const money = (value) => [{ _: Number(value.toFixed(2)), currencyID: 'MYR' }];
const TAX_SCHEME = [{ ID: [{ _: 'OTH', schemeID: 'UN/ECE 5153', schemeAgencyID: '6' }] }];

// ---- Test Data ----
const seller = {
  tin: 'C1234567890', sstReg: 'NA', msicCode: '46510',
  businessName: 'Test Sdn Bhd', address: 'Lot 1, KL',
  phone: '+60123456789', email: 'a@b.com',
  city: 'Kuala Lumpur', postalZone: '50000', stateCode: '14',
};

const GENERAL_TIN = 'EI00000000010';

const lines = [{
  description: 'Widget', qty: 2, uom: 'C62', unitPrice: 50,
  amount: 100, classificationCode: '003', taxType: '06',
  taxAmount: 0, taxRate: 0,
}];

// ---- party() from ublBuilder.ts ----
function party(opts) {
  const ident = [
    { ID: w(opts.tin, { schemeID: 'TIN' }) },
    { ID: w(opts.brn, { schemeID: 'BRN' }) },
    { ID: w(opts.sst, { schemeID: 'SST' }) },
    { ID: w('NA', { schemeID: 'TTX' }) },
  ];
  const p = {
    PartyIdentification: ident,
    PostalAddress: [{
      CityName: w(opts.city),
      PostalZone: w(opts.postal),
      CountrySubentityCode: w(opts.state),
      AddressLine: opts.addressLines.map((line) => ({ Line: w(line) })),
      Country: [{ IdentificationCode: [{ _: opts.country, listID: 'ISO3166-1', listAgencyID: '6' }] }],
    }],
    PartyLegalEntity: [{ RegistrationName: w(opts.name) }],
    Contact: [{ Telephone: w(opts.phone), ElectronicMail: w(opts.email) }],
  };
  if (opts.msic) {
    p.IndustryClassificationCode = [{ _: opts.msic, name: opts.msicName ?? '' }];
  }
  return { Party: [p] };
}

// ---- buildUbl() ----
function buildUbl() {
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const taxTotal = lines.reduce((s, l) => s + l.taxAmount, 0);
  const total = subtotal + taxTotal;

  const d = new Date();
  const issueDate = d.toISOString().slice(0, 10);
  const issueTime = d.toISOString().slice(11, 19) + 'Z';

  const invoice = {
    ID: w(`INV-${d.getTime()}`),
    IssueDate: w(issueDate),
    IssueTime: w(issueTime),
    InvoiceTypeCode: [{ _: '01', listVersionID: '1.0' }],
    DocumentCurrencyCode: w('MYR'),
  };

  // AccountingSupplierParty
  invoice.AccountingSupplierParty = [party({
    tin: seller.tin, brn: 'NA', sst: seller.sstReg || 'NA', name: seller.businessName,
    msic: seller.msicCode, msicName: '',
    city: seller.city ?? 'Kuala Lumpur', postal: seller.postalZone ?? '50000',
    state: seller.stateCode ?? '14', country: 'MYS',
    addressLines: [seller.address], phone: seller.phone || 'NA', email: seller.email || 'NA',
  })];

  // AccountingCustomerParty (general)
  invoice.AccountingCustomerParty = [party({
    tin: GENERAL_TIN, brn: 'NA', sst: 'NA', name: "Consolidated Buyer's",
    city: '', postal: '', state: '17', country: 'MYS',
    addressLines: ['NA'], phone: 'NA', email: 'NA',
  })];

  // InvoiceLine
  invoice.InvoiceLine = lines.map((line, idx) => ({
    ID: w(String(idx + 1)),
    InvoicedQuantity: [{ _: line.qty, unitCode: line.uom || 'C62' }],
    LineExtensionAmount: money(line.amount),
    TaxTotal: [{
      TaxAmount: money(line.taxAmount),
      TaxSubtotal: [{
        TaxableAmount: money(line.amount),
        TaxAmount: money(line.taxAmount),
        Percent: w(line.taxRate ?? 0),
        TaxCategory: [{
          ID: w(line.taxType || '06'),
          TaxScheme: TAX_SCHEME,
        }],
      }],
    }],
    Item: [{
      CommodityClassification: [
        { ItemClassificationCode: [{ _: line.classificationCode || '003', listID: 'CLASS' }] },
      ],
      Description: w(line.description),
    }],
    Price: [{ PriceAmount: money(line.unitPrice) }],
    ItemPriceExtension: [{ Amount: money(line.amount) }],
  }));

  // TaxTotal
  invoice.TaxTotal = [{
    TaxAmount: money(taxTotal),
    TaxSubtotal: [{
      TaxableAmount: money(subtotal),
      TaxAmount: money(taxTotal),
      TaxCategory: [{ ID: w('06'), TaxScheme: TAX_SCHEME }],
    }],
  }];

  // LegalMonetaryTotal
  invoice.LegalMonetaryTotal = [{
    LineExtensionAmount: money(subtotal),
    TaxExclusiveAmount: money(subtotal),
    TaxInclusiveAmount: money(total),
    PayableAmount: money(total),
  }];

  return {
    _D: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
    _A: 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
    _B: 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
    Invoice: [invoice],
  };
}

// ---- OAuth ----
async function getToken() {
  const res = await fetch(`${API_BASE}/connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'client_credentials',
      scope: 'InvoicingAPI',
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OAuth failed ${res.status}: ${text.slice(0, 500)}`);
  }
  const data = await res.json();
  return data.access_token;
}

// ---- Main ----
async function main() {
  const ubl = buildUbl();
  const ublJson = JSON.stringify(ubl);

  // ---- Step 1: OAuth ----
  console.log('[1] Fetching OAuth token...');
  const token = await getToken();
  console.log(`    token: ${token.slice(0, 20)}...`);

  // ---- Step 2: Compute b64 & hash ----
  const docB64 = Buffer.from(ublJson, 'utf8').toString('base64');
  const docHash = crypto.createHash('sha256').update(ublJson, 'utf8').digest('base64');
  console.log(`[2] doc length=${ublJson.length}  hash=${docHash.slice(0, 12)}...`);

  // ---- Step 3: Submit ----
  console.log('[3] Submitting to sandbox...');
  const submitRes = await fetch(`${API_BASE}/api/v1.0/documentsubmissions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      documents: [{
        format: 'JSON',
        document: docB64,
        documentHash: docHash,
        codeNumber: 'TEST-001',
      }],
    }),
  });

  if (!submitRes.ok) {
    const text = await submitRes.text().catch(() => '');
    console.error(`    FAILED HTTP ${submitRes.status}: ${text.slice(0, 1000)}`);
    process.exit(1);
  }

  const submitData = await submitRes.json();
  console.log(`    submissionUid: ${submitData.submissionUid}`);
  const docUuid = submitData.acceptedDocuments?.[0]?.uuid ?? '';
  console.log(`    acceptedDocument uuid: ${docUuid || '(none)'}`);

  // ---- Step 4: Poll ----
  let settled = null;
  let lastPollData = null;
  for (let i = 0; i < 8; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    const pollRes = await fetch(
      `${API_BASE}/api/v1.0/documentsubmissions/${submitData.submissionUid}?pageNo=1&pageSize=10`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!pollRes.ok) {
      console.log(`    [poll ${i + 1}] HTTP ${pollRes.status}`);
      continue;
    }
    const pollData = await pollRes.json();
    const status = pollData.overallStatus;
    console.log(`    [poll ${i + 1}] overallStatus=${status}`);
    if (status === 'Valid' || status === 'PartiallyValid') {
      settled = 'Valid';
      lastPollData = pollData;
      break;
    }
    if (status === 'Invalid') {
      settled = 'Invalid';
      lastPollData = pollData;
      break;
    }
  }

  if (settled === null) {
    console.log('\n=== TIMED OUT — still InProgress ===');
    process.exit(0);
  }

  console.log(`\n=== SETTLED: ${settled} ===`);

  // ---- Step 5: Document details ----
  const finalUuid = docUuid || lastPollData?.documentSummary?.[0]?.uuid;
  if (finalUuid) {
    const detailRes = await fetch(`${API_BASE}/api/v1.0/documents/${finalUuid}/details`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (detailRes.ok) {
      const detail = await detailRes.json();
      console.log('\n--- DOCUMENT DETAILS ---');
      console.log(`uuid:        ${detail.uuid}`);
      console.log(`longId:      ${detail.longId ?? '(none)'}`);
      console.log(`status:      ${detail.status}`);
      console.log(`dateTimeValidated: ${detail.dateTimeValidated ?? '(none)'}`);

      const steps = detail.validationResults?.validationSteps ?? [];
      if (steps.length > 0) {
        console.log(`\nvalidationSteps (${steps.length}):`);
        for (const step of steps) {
          const icon = step.status === 'Valid' ? 'PASS' : step.status === 'Invalid' ? 'FAIL' : step.status;
          console.log(`  [${icon}] ${step.name ?? step.stepDescription ?? 'unknown'}`);
          if (step.error) {
            console.log(`    error:      ${JSON.stringify(step.error)}`);
          }
          if (step.status === 'Invalid' && step.validationMessages) {
            for (const msg of step.validationMessages) {
              console.log(`    message:    ${msg.message ?? JSON.stringify(msg)}`);
            }
          }
        }
      }

      if (settled === 'Invalid') {
        const rejections = steps
          .filter((s) => s.status === 'Invalid')
          .map((s) => s.error?.errorMessage ?? s.error?.message ?? JSON.stringify(s.error ?? {}));
        console.log(`\nREJECTIONS (${rejections.length}):`);
        rejections.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
      }

      // Full detail JSON
      console.log('\n--- RAW DETAILS JSON ---');
      console.log(JSON.stringify(detail, null, 2));
    } else {
      const t = await detailRes.text().catch(() => '');
      console.log(`Details fetch failed HTTP ${detailRes.status}: ${t.slice(0, 500)}`);
    }
  }

  // ---- Full UBL submitted ----
  console.log('\n=== FULL UBL JSON SUBMITTED ===');
  console.log(ublJson);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
