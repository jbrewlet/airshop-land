# ROI Calculator Logic

This document explains the calculations used in the Lost Revenue calculator on the AirShop landing page.

## Purpose

The calculator shows potential customers how much revenue they're losing due to:
1. Inefficient quoting workflows
2. Manual inventory tracking
3. Stockout delays

**All calculations are done on a MONTHLY basis for consistency**, then multiplied by 12 for yearly.

---

## Inputs

### Primary Input
| Field | Default | Description |
|-------|---------|-------------|
| **Billing Rate** | $125/hr | What the shop charges customers per hour of work |

### Quoting Estimates (adjustable)
| Field | Default | Description |
|-------|---------|-------------|
| Quotes per week | 10 | Number of quotes created weekly |
| Time spent per quote | 25 min | Total time currently spent on each quote |
| Wasted time per quote | 10 min | Time lost to inefficiency (no templates, manual lookups, re-typing, etc.) |

**Note:** Only the "wasted time" is used in the calculation. The "time spent" field helps users contextualize the waste - if they spend 25 min/quote and 10 min is wasted, that's 40% inefficiency.

### Inventory Estimates (adjustable)
| Field | Default | Description |
|-------|---------|-------------|
| Manual tracking & counts | 2 hrs/wk | Weekly time spent on inventory management |
| Stockout delays | 1 day/mo | Days per month where work stops due to missing parts |

---

## Calculations (All Monthly)

### 1. Quoting Time Wasted

Only the **wasted time per quote** is counted, not total time:

```
Monthly quoting waste = (Wasted mins per quote × Quotes per week × 4.33 weeks/month) / 60
                      = (10 × 10 × 4.33) / 60
                      = 433 / 60
                      = 7.22 hours/month
```

### 2. Inventory Tracking Time

```
Monthly inventory hours = Weekly hours × 4.33 weeks/month
                        = 2 × 4.33
                        = 8.66 hours/month
```

### 3. Stockout Delays

Stockouts are entered as **days per month** - straightforward calculation:

```
Monthly stockout hours = Stockout days × 8 hours/day
                       = 1 × 8
                       = 8 hours/month
```

**Examples:**
| Stockout Days/Month | Hours Lost/Month |
|---------------------|------------------|
| 1 day | 8 hrs |
| 2 days | 16 hrs |
| 3 days | 24 hrs |

### 4. Total Monthly Hours Wasted

```
Total monthly hours = Quoting waste + Inventory + Stockouts
                    = 7.22 + 8.66 + 8
                    = 23.88 hours/month (rounds to 24)
```

### 5. Monthly Lost Revenue

```
Monthly lost revenue = Total monthly hours × Billing rate
                     = 23.88 × $125
                     = $2,985/month
```

### 6. Yearly Opportunity Cost

```
Yearly opportunity cost = Monthly lost revenue × 12 months
                        = $2,985 × 12
                        = $35,820/year
```

---

## Example Scenarios

### Default Values ($125/hr, 1 stockout day)
| Component | Hours/Month | Monthly Cost | Yearly Cost |
|-----------|-------------|--------------|-------------|
| Quoting waste (10 min × 10/wk × 4.33) | 7.22 hrs | $903 | $10,836 |
| Inventory tracking (2 hrs/wk × 4.33) | 8.66 hrs | $1,083 | $12,996 |
| Stockouts (1 day × 8 hrs) | 8.00 hrs | $1,000 | $12,000 |
| **TOTAL** | **~24 hrs/mo** | **~$2,985/mo** | **~$35,820/yr** |

### With 2 Stockout Days/Month
| Component | Hours/Month | Monthly Cost | Yearly Cost |
|-----------|-------------|--------------|-------------|
| Quoting waste | 7.22 hrs | $903 | $10,836 |
| Inventory tracking | 8.66 hrs | $1,083 | $12,996 |
| Stockouts (2 days × 8 hrs) | 16.00 hrs | $2,000 | $24,000 |
| **TOTAL** | **~32 hrs/mo** | **~$3,985/mo** | **~$47,820/yr** |

### Higher Volume Shop (20 quotes/wk, 15 min wasted/quote, $150/hr, 2 stockout days)
| Component | Hours/Month | Monthly Cost | Yearly Cost |
|-----------|-------------|--------------|-------------|
| Quoting waste (15 min × 20/wk × 4.33) | 21.65 hrs | $3,248 | $38,976 |
| Inventory tracking (2 hrs/wk × 4.33) | 8.66 hrs | $1,299 | $15,588 |
| Stockouts (2 days × 8 hrs) | 16.00 hrs | $2,400 | $28,800 |
| **TOTAL** | **~46 hrs/mo** | **~$6,947/mo** | **~$83,364/yr** |

---

## JavaScript Implementation

```javascript
function calculateROI() {
    const rate = parseFloat(rateInput.value) || 125;
    const quotesWeek = parseFloat(quotesWeekInput.value) || 10;
    const wastedPerQuote = parseFloat(wastedPerQuoteInput.value) || 10;
    const inventoryHours = parseFloat(inventoryHoursInput.value) || 2;
    const stockoutDays = parseFloat(stockoutDaysInput.value) || 1;
    
    // Calculate MONTHLY hours wasted
    // Quoting: wasted mins per quote × quotes/week × 4.33 weeks/month
    const quotingHoursMonthly = (wastedPerQuote * quotesWeek * 4.33) / 60;
    
    // Inventory: hrs/week × 4.33 weeks/month
    const inventoryHoursMonthly = inventoryHours * 4.33;
    
    // Stockouts: days × 8 hrs/day (already monthly)
    const stockoutHoursMonthly = stockoutDays * 8;
    
    // Total monthly hours
    const totalMonthlyHours = quotingHoursMonthly + inventoryHoursMonthly + stockoutHoursMonthly;
    
    // Revenue calculations
    const monthly = totalMonthlyHours * rate;
    const yearly = monthly * 12;
}
```

---

## Notes

- All estimates are intentionally **conservative** to maintain credibility
- Billing rate ($125/hr) is based on typical small shop rates in the US
- The "time spent per quote" field is for user context only - only "wasted time" affects the calculation
- Stockouts often have cascading effects (rush shipping, customer frustration, lost future business) not captured here
- The calculator does NOT factor in AirShop's subscription cost - it only shows the current waste
- Output values are displayed as **negative** to emphasize the loss
