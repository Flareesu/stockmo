    /* ─── ImportFleetModal ─── */
    function ImportFleetModal({ onClose, onBulkAdd }) {
      const [step, setStep]         = useState('upload'); // upload | sheet | preview | importing | done
      const [rows, setRows]         = useState([]);
      const [skipped, setSkipped]   = useState(0);
      const [progress, setProgress] = useState(0);
      const [imported, setImported] = useState(0);
      const [dragOver, setDragOver] = useState(false);
      const [workbook, setWorkbook]       = useState(null);
      const [sheetOptions, setSheetOptions] = useState([]); // [{name, rows, vinCount}]
      const [selectedSheet, setSelectedSheet] = useState('');
      const fileRef = useRef(null);

      /* column name aliases — case-sensitive exact match first, then case-insensitive */
      const ALIASES = {
        vin:            ['VIN','Vin','vin','CHASSIS','Chassis','chassis','Plate Number'],
        model:          ['MODEL','Model','model','Vehicle Model','vehicle_model'],
        variant:        ['VARIANT','Variant','variant','Trim'],
        exterior_color: ['Exterior COLOR','Exterior Color','Exterior','Color','color','COLOR','Colour','colour'],
        interior_color: ['Interior COLOR','Interior Color','Interior'],
        cs_number:      ['CS No.','CS No','CS Number'],
        engine_number:  ['ENGINE NUMBER','Engine Number'],
        fuel:           ['Fuel','fuel','FUEL','Fuel Type','fuel_type'],
        lot:            ['Lot','lot','LOT','Lot Number','lot_number','Parking','parking','Bay'],
        year:           ['YEAR','Year','year','Model Year'],
        stage:          ['Inventory Status','Stage','stage','STAGE','Status','status','STATUS'],
        arrival_date:   ['Port Arrival','Port Arrival Date','Arrival Date'],
        release_date:   ['Actual Delivery Date','Delivery Date'],
        invoice_number: ['Invoice #','Invoice No','Invoice'],
        bl_number:      ['BL','B/L','Bill of Lading'],
        contract_no:    ['CONTRACT NO.','Contract No','Contract Number'],
        sales_status:   ['Sales Status','sales_status'],
        dealer_group:   ['Dealer Group','dealer_group'],
        dealer:         ['Dealer','DEALER','Dealer Name'],
        region:         ['Region','region','REGION'],
        notes:          ['Remarks','remarks','Notes','Comments'],
      };

      const findCol = (headers, key) => {
        for (const alias of ALIASES[key]) {
          const idx = headers.findIndex(h => String(h).trim() === alias);
          if (idx >= 0) return idx;
        }
        // fallback: case-insensitive partial match
        const low = key.toLowerCase();
        return headers.findIndex(h => String(h).toLowerCase().includes(low));
      };

      const VALID_STAGES = new Set(['port','pdi','hold','stock','ready','released']);

      const [extraColNames, setExtraColNames] = useState([]);

      const parseSheet = (ws) => {
        try {
          const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
          if (raw.length < 2) { stockmoDialog.alert({ title: 'Empty sheet', message: 'This sheet has no data rows.' }); return; }
          const headers = raw[0].map(h => String(h).trim());
            const ci = {};
            for (const k of Object.keys(ALIASES)) ci[k] = findCol(headers, k);
            if (ci.vin < 0 || ci.model < 0) {
              stockmoDialog.alert({
                title: 'Missing columns',
                message: 'Could not detect a VIN column or Model column.\nMake sure row 1 has headers named "VIN" and "Model".',
              });
              return;
            }

            // Identify extra columns (not matched by any known alias)
            const knownIndices = new Set(Object.values(ci).filter(i => i >= 0));
            const extraCols = []; // [{idx, name}]
            headers.forEach((h, idx) => {
              if (h && !knownIndices.has(idx)) extraCols.push({ idx, name: h });
            });
            setExtraColNames(extraCols.map(c => c.name));

            let valid = [], skip = 0;
            for (let i = 1; i < raw.length; i++) {
              const r = raw[i];
              const vin   = String(r[ci.vin]   ?? '').trim();
              const model = String(r[ci.model] ?? '').trim();
              if (!vin || vin.length < 10 || !model) { skip++; continue; }
              const rawStage = ci.stage >= 0 ? String(r[ci.stage] ?? '').trim().toLowerCase() : '';

              // Collect extra fields from non-standard columns
              const extra_fields = {};
              for (const col of extraCols) {
                const val = r[col.idx];
                if (val !== undefined && val !== null && String(val).trim() !== '') {
                  // Apply excelDateToISO for date-like column names
                  if (/date|arrival/i.test(col.name) && typeof val === 'number') {
                    extra_fields[col.name] = excelDateToISO(val) || String(val).trim();
                  } else {
                    extra_fields[col.name] = typeof val === 'number' ? val : String(val).trim();
                  }
                }
              }

              valid.push({
                vin,
                model,
                variant:        ci.variant        >= 0 ? String(r[ci.variant]        ?? '').trim() : '',
                exterior_color: ci.exterior_color >= 0 ? String(r[ci.exterior_color] ?? '').trim() : '',
                interior_color: ci.interior_color >= 0 ? String(r[ci.interior_color] ?? '').trim() : '',
                cs_number:      ci.cs_number      >= 0 ? String(r[ci.cs_number]      ?? '').trim() : '',
                engine_number:  ci.engine_number  >= 0 ? String(r[ci.engine_number]  ?? '').trim() : '',
                invoice_number: ci.invoice_number >= 0 ? String(r[ci.invoice_number] ?? '').trim() : '',
                bl_number:      ci.bl_number      >= 0 ? String(r[ci.bl_number]      ?? '').trim() : '',
                contract_no:    ci.contract_no    >= 0 ? String(r[ci.contract_no]    ?? '').trim() : '',
                sales_status:   ci.sales_status   >= 0 ? String(r[ci.sales_status]   ?? '').trim() : '',
                dealer_group:   ci.dealer_group   >= 0 ? String(r[ci.dealer_group]   ?? '').trim() : '',
                dealer:         ci.dealer         >= 0 ? String(r[ci.dealer]         ?? '').trim() : '',
                region:         ci.region         >= 0 ? String(r[ci.region]         ?? '').trim() : '',
                fuel:           ci.fuel           >= 0 ? String(r[ci.fuel]           ?? '').trim() : '',
                lot:            ci.lot            >= 0 ? String(r[ci.lot]            ?? '').trim() : '',
                year:           ci.year           >= 0 ? (parseInt(r[ci.year]) || 2025) : 2025,
                stage:          rawStage,
                arrival_date:   excelDateToISO(ci.arrival_date >= 0 ? r[ci.arrival_date] : null),
                release_date:   excelDateToISO(ci.release_date >= 0 ? r[ci.release_date] : null),
                notes:          ci.notes          >= 0 ? String(r[ci.notes]          ?? '').trim() : '',
                extra_fields,
              });
            }
          setRows(valid); setSkipped(skip); setStep('preview');
        } catch (err) { stockmoDialog.alert({ title: 'Parse failed', message: 'Failed to parse sheet: ' + err.message }); }
      };

      const parseFile = (file) => {
        if (!file) return;
        if (!/\.(xlsx|xls|csv)$/i.test(file.name)) { stockmoDialog.alert({ title: 'Wrong file type', message: 'Please upload an .xlsx, .xls, or .csv file.' }); return; }
        if (file.size > 10 * 1024 * 1024) { stockmoDialog.alert({ title: 'File too large', message: 'Maximum size is 10 MB.' }); return; }
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
            if (!wb.SheetNames.length) { stockmoDialog.alert({ title: 'Empty workbook', message: 'No sheets found in workbook.' }); return; }
            if (wb.SheetNames.length === 1) {
              parseSheet(wb.Sheets[wb.SheetNames[0]]);
              return;
            }
            // Multiple sheets — build options with VIN counts
            const opts = wb.SheetNames.map(name => {
              const ws = wb.Sheets[name];
              const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
              if (raw.length < 2) return { name, rows: Math.max(0, raw.length - 1), vinCount: 0 };
              const hdrs = raw[0].map(h => String(h).trim());
              const vinIdx = findCol(hdrs, 'vin');
              let vinCount = 0;
              if (vinIdx >= 0) {
                for (let i = 1; i < raw.length; i++) {
                  const v = String(raw[i][vinIdx] ?? '').trim();
                  if (v.length >= 10) vinCount++;
                }
              }
              return { name, rows: raw.length - 1, vinCount };
            });
            // Default-select sheet with most VINs (fallback: most rows)
            const best = [...opts].sort((a, b) => (b.vinCount - a.vinCount) || (b.rows - a.rows))[0];
            setWorkbook(wb);
            setSheetOptions(opts);
            setSelectedSheet(best?.name || wb.SheetNames[0]);
            setStep('sheet');
          } catch (err) { stockmoDialog.alert({ title: 'Parse failed', message: 'Failed to parse file: ' + err.message }); }
        };
        reader.readAsArrayBuffer(file);
      };

      const confirmSheet = () => {
        if (!workbook || !selectedSheet) return;
        parseSheet(workbook.Sheets[selectedSheet]);
      };

      const handleImport = async () => {
        setStep('importing'); setProgress(0);
        try {
          const count = await onBulkAdd(rows, p => setProgress(p));
          setImported(count); setStep('done');
        } catch (err) {
          stockmoDialog.alert({ title: 'Import failed', message: err.message || String(err) });
          setStep('preview');
        }
      };

      const inputCls = "w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] text-navy outline-none focus:border-primary transition-colors";

      return (
        <div className="fixed inset-0 bg-black/50 z-50 anim-fade-in flex items-center justify-center p-4"
          onClick={step === 'importing' ? null : onClose}>
          <div className="w-full max-w-[620px] lg:max-w-[760px] bg-white rounded-[24px] shadow-2xl anim-slide-up max-h-[92vh] flex flex-col"
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="font-black text-navy text-[18px]">Import Fleet</h2>
                <p className="text-[11px] text-muted mt-0.5">Upload an Excel or CSV file to bulk-add vehicles with full checklists</p>
              </div>
              {step !== 'importing' && (
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Icon name="close" className="text-navy" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6">

              {/* ── UPLOAD ── */}
              {step === 'upload' && (
                <div className="space-y-4">
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); parseFile(e.dataTransfer.files[0]); }}
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-[20px] p-10 flex flex-col items-center justify-center cursor-pointer transition-all select-none
                      ${dragOver ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'}`}>
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-3">
                      <Icon name="upload_file" className="text-primary text-3xl" />
                    </div>
                    <div className="text-[14px] font-black text-navy mb-1">Drop your file here</div>
                    <div className="text-[12px] text-muted">or click to browse — .xlsx · .xls · .csv</div>
                    <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                      onChange={e => parseFile(e.target.files[0])} />
                  </div>

                  <div className="bg-gray-50 rounded-[16px] p-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted mb-3">Column Reference (row 1 headers)</div>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                      {[
                        ['VIN',    'Min 10 chars',                    true ],
                        ['Model',  'Must match a vehicle model name', true ],
                        ['Color',  'Paint color name',                false],
                        ['Engine', 'Engine spec',                     false],
                        ['Fuel',   'Gasoline / Diesel / HEV / PHEV / Electric', false],
                        ['Lot',    'Parking lot or bay number',       false],
                        ['Year',   'Model year (default 2025)',        false],
                        ['Stage',  'port/pdi/hold/stock/ready',       false],
                      ].map(([col, desc, req]) => (
                        <div key={col} className="flex items-start gap-2">
                          <span className={`mt-0.5 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full flex-shrink-0
                            ${req ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-muted'}`}>{req ? 'req' : 'opt'}</span>
                          <div>
                            <span className="text-[12px] font-bold text-navy">{col}</span>
                            <span className="text-[10px] text-muted ml-1">{desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── SHEET PICKER ── */}
              {step === 'sheet' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-[14px] px-4 py-3 flex items-start gap-3">
                    <Icon name="tab" className="text-blue-500 text-xl flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[13px] font-black text-navy">Multiple sheets detected</div>
                      <div className="text-[11px] text-muted mt-0.5">Select which sheet contains the vehicles to import. We pre-selected the one with the most VIN rows.</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {sheetOptions.map(opt => {
                      const active = opt.name === selectedSheet;
                      return (
                        <button key={opt.name} onClick={() => setSelectedSheet(opt.name)}
                          className={`w-full text-left rounded-[14px] border-2 px-4 py-3 flex items-center gap-3 transition-all
                            ${active ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/40 hover:bg-gray-50'}`}>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                            ${active ? 'border-primary' : 'border-gray-300'}`}>
                            {active && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] font-black text-navy truncate">{opt.name}</div>
                            <div className="text-[11px] text-muted">
                              {opt.rows.toLocaleString()} data row{opt.rows !== 1 ? 's' : ''}
                              {opt.vinCount > 0 && <> · <span className="text-primary font-bold">{opt.vinCount.toLocaleString()} VIN{opt.vinCount !== 1 ? 's' : ''}</span></>}
                              {opt.vinCount === 0 && opt.rows > 0 && <> · <span className="text-amber-600">no VIN column</span></>}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button onClick={() => { setStep('upload'); setWorkbook(null); setSheetOptions([]); setSelectedSheet(''); }}
                      className="flex-1 py-3 rounded-full border-2 border-gray-200 text-navy font-bold text-[12px] uppercase tracking-wider hover:bg-gray-50 transition-all">
                      Change File
                    </button>
                    <button onClick={confirmSheet} disabled={!selectedSheet}
                      className="flex-1 py-3 rounded-full bg-primary text-white font-black text-[12px] uppercase tracking-wider shadow-primary-glow hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40">
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* ── PREVIEW ── */}
              {step === 'preview' && (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-1 bg-green-50 border border-green-200 rounded-[14px] px-4 py-3 flex items-center gap-3">
                      <Icon name="check_circle" fill className="text-green-500 text-2xl flex-shrink-0" />
                      <div>
                        <div className="text-[14px] font-black text-navy">{rows.length} vehicles ready</div>
                        <div className="text-[10px] text-muted">PDI, maintenance & final checklists will be seeded</div>
                      </div>
                    </div>
                    {skipped > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-[14px] px-4 py-3 flex items-center gap-3">
                        <Icon name="warning" fill className="text-amber-500 text-2xl flex-shrink-0" />
                        <div>
                          <div className="text-[14px] font-black text-navy">{skipped} skipped</div>
                          <div className="text-[10px] text-muted">missing VIN or Model</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {extraColNames.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-[14px] px-4 py-3 flex items-start gap-3">
                      <Icon name="table_chart" className="text-blue-500 text-xl flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[12px] font-bold text-navy">{extraColNames.length} extra column{extraColNames.length !== 1 ? 's' : ''} detected</div>
                        <div className="text-[10px] text-muted mt-0.5 leading-relaxed">{extraColNames.join(', ')}</div>
                        <div className="text-[10px] text-blue-600 mt-1 font-medium">These will be saved and shown in each vehicle's detail view</div>
                      </div>
                    </div>
                  )}

                  <div className="overflow-x-auto rounded-[14px] border border-gray-100">
                    <table className="w-full text-[11px]">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          {['#','VIN','Model','Color','Lot','Year','Stage'].map(h => (
                            <th key={h} className="px-3 py-2 text-left font-bold text-muted text-[9px] uppercase tracking-widest whitespace-nowrap">{h}</th>
                          ))}
                          {extraColNames.slice(0, 3).map(h => (
                            <th key={h} className="px-3 py-2 text-left font-bold text-blue-500 text-[9px] uppercase tracking-widest whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(0, 10).map((r, i) => (
                          <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50">
                            <td className="px-3 py-2 text-muted">{i + 1}</td>
                            <td className="px-3 py-2 font-mono font-bold text-navy text-[10px]">{r.vin}</td>
                            <td className="px-3 py-2 text-navy font-medium">{r.model}</td>
                            <td className="px-3 py-2 text-muted">{r.color || '—'}</td>
                            <td className="px-3 py-2 text-muted">{r.lot || '—'}</td>
                            <td className="px-3 py-2 text-muted">{r.year}</td>
                            <td className="px-3 py-2">
                              <span className="px-2 py-0.5 bg-primary/10 text-primary font-bold rounded-full">{r.stage}</span>
                            </td>
                            {extraColNames.slice(0, 3).map(col => (
                              <td key={col} className="px-3 py-2 text-muted text-[10px]">{r.extra_fields?.[col] ?? '—'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {rows.length > 10 && (
                      <div className="text-center py-2 text-[11px] text-muted border-t border-gray-100">
                        …and {rows.length - 10} more rows not shown
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button onClick={() => { setStep(workbook && sheetOptions.length > 1 ? 'sheet' : 'upload'); setRows([]); setSkipped(0); }}
                      className="flex-1 py-3 rounded-full border-2 border-gray-200 text-navy font-bold text-[12px] uppercase tracking-wider hover:bg-gray-50 transition-all">
                      {workbook && sheetOptions.length > 1 ? 'Change Sheet' : 'Change File'}
                    </button>
                    <button onClick={handleImport} disabled={rows.length === 0}
                      className="flex-1 py-3 rounded-full bg-primary text-white font-black text-[12px] uppercase tracking-wider shadow-primary-glow hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40">
                      Import {rows.length} Vehicles
                    </button>
                  </div>
                </div>
              )}

              {/* ── IMPORTING ── */}
              {step === 'importing' && (
                <div className="flex flex-col items-center py-10 gap-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Icon name="cloud_upload" className="text-primary text-3xl" />
                  </div>
                  <div className="text-center">
                    <div className="text-[17px] font-black text-navy">Importing {rows.length} vehicles…</div>
                    <div className="text-[12px] text-muted mt-1">Seeding PDI checklists, maintenance tasks & final checks</div>
                    <div className="text-[11px] text-muted mt-0.5">Please keep this window open</div>
                  </div>
                  <div className="w-full space-y-2">
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex justify-between text-[11px] text-muted">
                      <span>{Math.round(progress * rows.length / 100)} of {rows.length} vehicles</span>
                      <span className="font-bold text-primary">{Math.round(progress)}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── DONE ── */}
              {step === 'done' && (
                <div className="flex flex-col items-center py-10 gap-5 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                    <Icon name="check_circle" fill className="text-green-500 text-3xl" />
                  </div>
                  <div>
                    <div className="text-[20px] font-black text-navy">Import Complete</div>
                    <div className="text-[13px] text-muted mt-1">{imported} vehicle{imported !== 1 ? 's' : ''} added to your fleet.</div>
                    <div className="text-[12px] text-muted mt-0.5">PDI, maintenance & final checklists seeded for each vehicle.</div>
                  </div>
                  <button onClick={onClose}
                    className="px-10 py-3 rounded-full bg-primary text-white font-black text-[13px] uppercase tracking-wider shadow-primary-glow hover:brightness-110 transition-all mt-2">
                    View Fleet
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

