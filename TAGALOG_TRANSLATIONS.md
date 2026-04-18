# StockMo — Bilingual String Reference (EN / TL)

Full translation table for all user-facing strings. Used by the `T` object in the app's JS.

---

## Navigation & Global UI

| Key | English | Tagalog |
|-----|---------|---------|
| `nav_home` | HOME | HOME |
| `nav_stock` | STOCK | STOCK |
| `nav_maint` | MAINT | MAINT |
| `nav_final` | FINAL | FINAL |
| `nav_arrive` | ARRIVE | DATING |
| `admin_title` | Admin Panel | Admin Panel |
| `admin_sub` | Supervisor view · Apex Motors Fleet | Para sa Superbisor · Apex Motors Fleet |
| `add_vehicle` | Add Vehicle | Magdagdag ng Sasakyan |
| `pipeline` | Pipeline | Daloy ng Sasakyan |
| `needs_attn` | Needs Attention | Kailangan ng Aksyon |
| `recent_act` | Recent Activity | Mga Kamakailang Aktibidad |

---

## Stage Labels

| Key | English | Tagalog |
|-----|---------|---------|
| `stage_port` | Port | Port |
| `stage_pdi` | PDI | PDI |
| `stage_stock` | Stockyard | Stockyard |
| `stage_ready` | Ready | Handa |
| `stage_released` | Released | Na-release |
| `stage_hold` | Hold | Hold |

---

## Dashboard Stats

| Key | English | Tagalog |
|-----|---------|---------|
| `port_pdi` | Port / PDI | Port / PDI |
| `in_stockyard` | In Stockyard | Sa Stockyard |
| `ready_final` | Ready / Final | Handa / Final |
| `active_fleet` | Active Fleet | Aktibong Fleet |
| `arriving` | arriving | darating |
| `inspecting` | inspecting | sinisiyasat |
| `maint_due` | maint due | maintenance na |
| `awaiting_dealer` | awaiting dealer | hinihintay ng dealer |
| `released_lbl` | released | na-release |
| `attn_none` | No urgent items right now. | Walang urgent na kailangan ng aksyon. |

---

## Checklist States

| State | English | Tagalog display |
|-------|---------|-----------------|
| pending | (empty box) | (walang laman) |
| done | ✓ | ✓ |
| issue | ! | ! |
| `done_lbl` | done | tapos |
| `issue_lbl` | issue | may sira |
| `issues_lbl` | issues | may sira |

---

## PDI Checklist Items (Tagalog)

### Panlabas (Exterior)
| # | Tagalog |
|---|---------|
| 1 | Mga panel — walang kalmot o pisa |
| 2 | Kondisyon ng pintura at kulay |
| 3 | Lahat ng salamin — walang basag |
| 4 | Mga ilaw — gumagana lahat |
| 5 | Mga rubber seal ng pinto |

### Loob (Interior)
| # | Tagalog |
|---|---------|
| 6 | Dashboard — walang warning lights |
| 7 | Lahat ng kontrol at switch |
| 8 | AC / heater — gumagana |
| 9 | Seat belt — nagkukuha at naka-lock |
| 10 | Interior trim — walang sira |

### Mekanikal (Mechanical)
| # | Tagalog |
|---|---------|
| 11 | Engine — umaandar, walang warning |
| 12 | Preno — matatag, walang ingay |
| 13 | Lahat ng gulong — tamang hangin |
| 14 | Battery voltage — ok |
| 15 | Langis ng makina at coolant |

### Dokumento (Documentation)
| # | Tagalog |
|---|---------|
| 16 | Manual at service book — kumpleto |
| 17 | Susi — kumpleto ang lahat |
| 18 | VIN plate — tugma sa dokumento |

---

## Stockyard Maintenance Tasks (Tagalog)

| # | Tagalog | Frequency |
|---|---------|-----------|
| 1 | Pag-uandar ng makina (idle run) | 7 araw |
| 2 | Pag-ikot ng gulong (flat-spot prevention) | 30 araw |
| 3 | Battery check at pag-charge | 30 araw |
| 4 | Tsek ng presyur ng gulong | 14 araw |
| 5 | Hugasan at proteksyon ng labas | 14 araw |
| 6 | Linisin ang loob | 30 araw |
| 7 | Tsek ng mga fluid | 60 araw |
| 8 | Tsek ng preno | 60 araw |
| 9 | Inspeksyon sa daga at peste | 30 araw |

---

## Final Inspection Items (Tagalog)

### Panlabas
| # | Tagalog |
|---|---------|
| 1 | Walang bagong sira mula PDI |
| 2 | Pintura — walang bagong kalmot |
| 3 | Salamin — malinis at buo |
| 4 | Hugasan at polish na |

### Loob
| # | Tagalog |
|---|---------|
| 5 | Nilinis ang loob nang buo |
| 6 | Walang bagong sira sa loob mula PDI |

### Mekanikal
| # | Tagalog |
|---|---------|
| 7 | Engine — walang bagong warning lights |
| 8 | Lahat ng gulong — delivery pressure |
| 9 | Battery — puno na ang charge |

### Dokumento
| # | Tagalog |
|---|---------|
| 10 | Kumpleto ang mga susi |
| 11 | Manual, docs, service book — kumpleto |
| 12 | Mga natuklasan sa PDI — naayos o naitala |

---

## Stage Action Buttons

| Key | English | Tagalog |
|-----|---------|---------|
| `start_pdi` | START PDI INSPECTION | SIMULAN ANG PDI |
| `pdi_pass` | PDI PASSED — MOVE TO STOCKYARD | PUMASA SA PDI — ILIPAT SA STOCKYARD |
| `complete_pdi` | COMPLETE PDI — MOVE TO STOCKYARD | TAPUSIN ANG PDI — ILIPAT SA STOCKYARD |
| `put_hold` | PUT ON HOLD | ILAGAY SA HOLD |
| `override_stock` | Override — send to stock anyway | I-override — ipadala sa stock kahit may sira |
| `pass_final` | PASS TO FINAL INSPECTION | IPASA SA FINAL INSPECTION |
| `release_dealer` | RELEASE TO DEALER | I-RELEASE SA DEALER |
| `resume_pdi` | RESUME PDI AFTER REPAIR | IPAGPATULOY ANG PDI PAGKATAPOS NG AYOS |
| `save_notes` | SAVE NOTES | I-SAVE ANG MGA TALA |
| `notes_saved` | Notes saved | Nai-save ang mga tala |
| `assign_btn` | ASSIGN | I-ASSIGN |
| `confirm_add` | CONFIRM — ADD TO STOCKMO | KUMPIRMAHIN — IDAGDAG SA STOCKMO |

---

## Wizard Steps

| Key | English | Tagalog |
|-----|---------|---------|
| `wiz_step1` | Port Arrival | Port Arrival |
| `wiz_step2` | PDI | PDI |
| `wiz_step3` | Assign | I-assign |
| `wiz_step4` | Confirm | Kumpirmahin |
| `wiz_sub1` | Step 1 of 4 — Port Arrival | Hakbang 1 ng 4 — Port Arrival |
| `wiz_sub2` | Step 2 of 4 — PDI | Hakbang 2 ng 4 — PDI |
| `wiz_sub3` | Step 3 of 4 — Assign | Hakbang 3 ng 4 — I-assign |
| `wiz_sub4` | Step 4 of 4 — Confirm | Hakbang 4 ng 4 — Kumpirmahin |

---

## Form Field Labels

| Key | English | Tagalog |
|-----|---------|---------|
| `make` | Make | Make |
| `model` | Model | Model |
| `year` | Year | Taon |
| `color` | Color | Kulay |
| `engine` | Engine | Engine |
| `fuel` | Fuel Type | Uri ng Gasolina |
| `lot_pos` | Lot Position | Posisyon sa Lot |
| `arrival_notes` | Arrival Notes | Mga Tala sa Pagdating |
| `dealer_name` | Dealer Name | Pangalan ng Dealer |

---

## Maintenance UI

| Key | English | Tagalog |
|-----|---------|---------|
| `all_schedule` | All on schedule | Lahat ay on schedule |
| `overdue` | Overdue | Huli na |
| `due_in` | Due in | Due in |
| `maint_starts` | Maintenance starts when vehicle enters stockyard. | Magsisimula ang maintenance kapag nandito na sa stockyard. |

---

## Translation Guidelines

1. **Use natural Filipino** — how a yard technician would say it, not textbook Tagalog
2. **Keep technical terms** — VIN, PDI, battery, engine, hold — these are understood as-is
3. **Tagalog verbs for actions** — "I-save", "I-release", "I-assign" (Filipino uses i- prefix for English verbs)
4. **Short labels stay short** — button text should still fit on one line
5. **Tab labels stay in English** — PDI, MAINT, FINAL — these are industry terms used daily
