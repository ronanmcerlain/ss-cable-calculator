# SS Cable Size Calculator

Silverstone cable sizing tool for typical power station circuits: 415 V and 1000 V AC, 240 V single-phase, 11 kV and 24 V DC.

**Live tool:** https://ronanmcerlain.github.io/ss-cable-calculator/

## Checks
- Current rating, with temperature, grouping, soil/depth and covered-tray derating
- Voltage drop
- Short circuit (adiabatic, using K from AS/NZS 3008.1.1 Table 5.1)
- Earth conductor sizing (AS/NZS 3000 Table 5.1) and earth fault withstand
- Earth fault loop impedance (AS/NZS 3000 Appendix B simplified method)
- Parallel runs

## Data sources
- **LV single-core, Cu and Al:** AS/NZS 3008.1.1 Tables 3.13, 3.14, 4.1(A), 4.5(A), 5.1 and 5.2. Al resistance is from IEC 60228 until Table 4.5(B) is loaded.
- **LV multicore and flexible:** manufacturer data based on AS/NZS 3008.1.1
- **11 kV, Cu and Al:** Prysmian MV Guide

The **Cable data** tab in the tool lists every value it uses.

Engineering aid only. Verify results against AS/NZS 3008.1.1/1.2 and AS/NZS 3000 before issue.

Single self-contained `index.html` with no build step.
