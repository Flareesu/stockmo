# StockMo — Stockyard Maintenance Schedule

9 recurring tasks. Auto-generated when a vehicle enters the stockyard (moves to `stock` stage). Each task tracks last completion date and calculates next due date.

---

## Task Reference

| # | Task (Tagalog) | Task (English) | Frequency | Priority | Reason |
|---|---------------|---------------|-----------|----------|--------|
| sm1 | Pag-uandar ng makina (idle run) | Engine start & idle run | **7 days** | HIGH | Prevents battery drain; keeps seals, injectors, and coolant system active |
| sm2 | Pag-ikot ng gulong (flat-spot prevention) | Tire rotation | **30 days** | HIGH | Static load on one spot causes permanent flat spots in tires within 4–8 weeks |
| sm3 | Battery check at pag-charge | Battery check & top charge | **30 days** | HIGH | Parked vehicles slowly drain battery; prevents dead on delivery |
| sm4 | Tsek ng presyur ng gulong | Tire pressure check | **14 days** | MED | Temperature swings (day/night) affect pressure; maintains safety specs |
| sm5 | Hugasan at proteksyon ng labas | Exterior wash & protect | **14 days** | LOW | Bird droppings, dust, and tree sap etch into paint within 2 weeks |
| sm6 | Linisin ang loob | Interior clean & dehumidify | **30 days** | LOW | Prevents mold growth in humid climates; keeps interior presentable |
| sm7 | Tsek ng mga fluid | Fluid levels check | **60 days** | MED | Oil, coolant, brake fluid, washer fluid — slow leak detection |
| sm8 | Tsek ng preno | Brake check | **60 days** | MED | Calipers can bind during extended storage; prevents binding and corrosion |
| sm9 | Inspeksyon sa daga at peste | Pest & rodent inspection | **30 days** | MED | Rodents chew wiring harnesses; catches infestations early |

---

## How the Schedule Works

### Generation
When a vehicle's stage changes to `stock`, `makeMaint(stockDate)` is called:

```javascript
function makeMaint(startDate) {
  return STOCK_MAINT.map(m => ({
    ...m,
    lastDone: startDate,
    nextDue:  addDays(startDate, m.freq),
    note:     ''
  }));
}
```

Each task's `nextDue` is set to `stockDate + frequency`. The first batch of tasks will be due in 7–60 days from stockyard entry.

### Overdue Detection
```javascript
function hasMaintDue(car) {
  return car.stockMaint &&
    car.stockMaint.some(m => daysAgo(m.nextDue) >= 0);
}
```

A task is overdue when `daysAgo(nextDue) >= 0` — meaning today is on or past the due date.

### Completing a Task
When a technician taps DONE:
```javascript
m.lastDone = todayString();
m.nextDue  = addDays(todayString(), m.freq);
car.history.unshift(`${todayString()}: ${m.name} — natapos na`);
saveCars(cars);
```

The schedule resets forward from today. This means if a task is done 5 days late, the next due is still `freq` days from completion, not from the original due date.

---

## Visual Status in App

| Condition | Color | Label |
|-----------|-------|-------|
| On schedule | Green | `Next: YYYY-MM-DD` |
| Due within 7 days | Amber | `Due in Nd` |
| Overdue | Red | `Huli na Nd` |

---

## Maintenance Log Format

Every DONE tap adds a history entry:
```
2025-03-16: Pag-uandar ng makina (idle run) — natapos na
2025-03-16: Pag-ikot ng gulong (flat-spot prevention) — natapos na
```

This creates a complete maintenance trail for every vehicle, useful for:
- Proving diligence if a battery or tire fails post-delivery
- Tracking which technician maintained which vehicle
- Auditing maintenance gaps between log entries

---

## Maintenance End

The stockyard maintenance schedule is active while `stage === 'stock'`. Once a vehicle advances to `ready` (final inspection stage), the recurring schedule is no longer shown in the maintenance view. The history record remains permanently.
