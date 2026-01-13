function onEdit(e) {
    if (!e || !e.range) return;
  
    const sh = e.range.getSheet();
    if (!sh || sh.getName() !== "Report") return;
  
    const a1 = e.range.getA1Notation();
    const type = sh.getRange("A2").getValue();
    const sourceMode = sh.getRange("B3").getValue();
    const query = sh.getRange("B2").getDisplayValue().trim();
  
    if (a1 === "A2") {
      renderReportHeaders_(type);
  
      if (sourceMode === "LIVE") {
        loadSnapshotByType_(type);
      }
  
      if (query) {
        type === "Confluence projects"
          ? fillConfluenceReportResults_()
          : fillReportResults_();
      } else {
        sh.getRange("D2").setValue("⚠ Введіть запит у B2");
      }
  
      return;
    }
  
    if (a1 === "B3") {
      if (sourceMode === "LIVE") {
        loadSnapshotByType_(type);
      } else {
        loadBackupBySelectedDate_();
        return;
      }
  
      if (query) {
        type === "Confluence projects"
          ? fillConfluenceReportResults_()
          : fillReportResults_();
      } else {
        sh.getRange("D2").setValue("⚠ Введіть запит у B2");
      }
      return;
    }
  
    if (a1 === "B2" || a1 === "C2") {
      type === "Confluence projects"
        ? fillConfluenceReportResults_()
        : fillReportResults_();
    }
  }
  
  
  function loadSnapshotByType_(type) {
    if (type === "Confluence projects") {
      loadLiveConfluenceSourceToSnapshot_();
    } else {
      loadLiveJiraSourceToSnapshot_();
    }
  }
  
  
  function loadLiveJiraSourceToSnapshot_() {
    const ss = SpreadsheetApp.getActive();
    const src = ss.getSheetByName("Source");
    if (!src) throw new Error("Source not found");
  
    let snap = ss.getSheetByName("Source_Snapshot");
    if (!snap) {
      snap = ss.insertSheet("Source_Snapshot");
      snap.hideSheet();
    }
  
    snap.clearContents();
    const data = src.getDataRange().getValues();
    snap.getRange(1, 1, data.length, data[0].length).setValues(data);
  }
  
  function loadLiveConfluenceSourceToSnapshot_() {
    const ss = SpreadsheetApp.getActive();
    const src = ss.getSheetByName("Source_Confluence");
    if (!src) throw new Error("Source_Confluence not found");
  
    let snap = ss.getSheetByName("Source_Snapshot");
    if (!snap) {
      snap = ss.insertSheet("Source_Snapshot");
      snap.hideSheet();
    }
  
    snap.clearContents();
    const data = src.getDataRange().getValues();
    snap.getRange(1, 1, data.length, data[0].length).setValues(data);
  }
  
  
  function renderReportHeaders_(type) {
    const rep = SpreadsheetApp.getActive().getSheetByName("Report");
    if (!rep) return;
  
    rep.getRange("D4:Z5000").clearContent().clearFormat();
  
    const headers =
      type === "Confluence projects"
        ? [
            "Space key",
            "Space name",
            "Permission",
            "Granted via",
            "Granted by",
            "Name",
            "Surname",
            "Email"
          ]
        : [
            "Group",
            "Project key",
            "Role",
            "Name",
            "Surname",
            "Email"
          ];
  
    rep.getRange(4, 4, 1, headers.length).setValues([headers]);
    rep.getRange(4, 4, 1, headers.length)
      .setBackground("#cfe2f3")
      .setFontWeight("bold");
  
    rep.getRange(5, 4, 5000, headers.length).clearContent();
  }
  
  
  function fillReportResults_() {
    const ss = SpreadsheetApp.getActive();
    const rep = ss.getSheetByName("Report");
    const src = ss.getSheetByName("Source_Snapshot");
  
    if (!src || src.getLastRow() < 2) {
      rep.getRange("D2").setValue("⚠ No Jira data");
      return;
    }
  
    const query = rep.getRange("B2").getDisplayValue().trim().toLowerCase();
    const mode = rep.getRange("C2").getDisplayValue().trim();
  
    if (!query) {
      rep.getRange("D2").setValue("⚠ Введіть запит у B2");
      return;
    }
  
    rep.getRange("D2").setValue("⏳ Loading…");
  
    const rows = src.getRange(2, 1, src.getLastRow() - 1, 6).getValues();
    let matched = [];
  
    rows.forEach(r => {
      const name = (r[0] || "").toLowerCase();
      const surname = (r[1] || "").toLowerCase();
      const email = (r[2] || "").toLowerCase();
  
      const full = `${name} ${surname}`;
      const rev = `${surname} ${name}`;
  
      if (
        email.includes(query) ||
        name.includes(query) ||
        surname.includes(query) ||
        full.includes(query) ||
        rev.includes(query)
      ) {
        matched.push({
          group: r[4],
          projectKey: r[3],
          role: r[5],
          name: r[0],
          surname: r[1],
          email: r[2]
        });
      }
    });
  
    if (!matched.length) {
      rep.getRange("D5:I5000").clearContent();
      rep.getRange("D2").setValue("❌ Нічого не знайдено");
      return;
    }
  
    matched.sort((a, b) =>
      a.projectKey.localeCompare(b.projectKey) ||
      a.group.localeCompare(b.group) ||
      a.role.localeCompare(b.role)
    );
  
    const out =
      mode === "Без прив’язки"
        ? [...new Set(matched.map(m => m.group))].map(g => [g, "", "", "", "", ""])
        : matched.map(m => [
            m.group,
            m.projectKey,
            m.role,
            m.name,
            m.surname,
            m.email
          ]);
  
    rep.getRange("D5:I5000").clearContent();
    rep.getRange(5, 4, out.length, 6).setValues(out);
    rep.getRange("D2").setValue(`✔ Знайдено ${matched.length} записів`);
  }
  
  
  function fillConfluenceReportResults_() {
    const ss = SpreadsheetApp.getActive();
    const rep = ss.getSheetByName("Report");
    const src = ss.getSheetByName("Source_Snapshot");
  
    if (!src || src.getLastRow() < 2) {
      rep.getRange("D2").setValue("⚠ No Confluence data");
      return;
    }
  
    const query = rep.getRange("B2").getDisplayValue().trim().toLowerCase();
    const mode = rep.getRange("C2").getDisplayValue().trim();
  
    if (!query) {
      rep.getRange("D2").setValue("⚠ Введіть запит у B2");
      return;
    }
  
    rep.getRange("D2").setValue("⏳ Loading…");
  
    const rows = src.getRange(2, 1, src.getLastRow() - 1, 8).getValues();
    let matched = [];
  
    rows.forEach(r => {
      const name = (r[0] || "").toLowerCase();
      const surname = (r[1] || "").toLowerCase();
      const email = (r[2] || "").toLowerCase();
      const spaceKey = (r[3] || "").toLowerCase();
      const spaceName = (r[4] || "").toLowerCase();
      const via = r[6];
      const by = (r[7] || "").toLowerCase();
  
      const full = `${name} ${surname}`;
      const rev = `${surname} ${name}`;
  
      let match =
        email.includes(query) ||
        name.includes(query) ||
        surname.includes(query) ||
        full.includes(query) ||
        rev.includes(query) ||
        spaceKey.includes(query) ||
        spaceName.includes(query);
  
      if (!match && via === "Group" && by.includes(query)) match = true;
      if (!match) return;
      if (mode === "Без прив’язки" && via !== "Group") return;
  
      matched.push({
        spaceKey: r[3],
        spaceName: r[4],
        permission: r[5],
        via: r[6],
        by: r[7],
        name: r[0],
        surname: r[1],
        email: r[2]
      });
    });
  
    if (!matched.length) {
      rep.getRange("D5:Z5000").clearContent();
      rep.getRange("D2").setValue("❌ Нічого не знайдено");
      return;
    }
  
    const out =
      mode === "Без прив’язки"
        ? Object.values(
            matched.reduce((acc, m) => {
              const k = `${m.spaceKey}|${m.permission}|${m.by}`;
              if (!acc[k])
                acc[k] = [
                  m.spaceKey,
                  m.spaceName,
                  m.permission,
                  m.via,
                  m.by,
                  "",
                  "",
                  ""
                ];
              return acc;
            }, {})
          )
        : matched.map(m => [
            m.spaceKey,
            m.spaceName,
            m.permission,
            m.via,
            m.by,
            m.name,
            m.surname,
            m.email
          ]);
  
    rep.getRange("D5:Z5000").clearContent();
    rep.getRange(5, 4, out.length, out[0].length).setValues(out);
    rep.getRange("D2").setValue(`✔ Знайдено ${matched.length} записів`);
  }
  
  function loadBackupBySelectedDate_() {
    const ss = SpreadsheetApp.getActive();
    const rep = ss.getSheetByName("Report");
    const backups = ss.getSheetByName("Report_Backups");
    if (!rep || !backups) return;
  
    const selectedDate = rep.getRange("B3").getValue();
    const typeLabel = rep.getRange("A2").getValue();
  
    const wantedType =
      typeLabel === "Confluence projects" ? "CONFLUENCE" : "JIRA";
  
    const rows = backups
      .getRange(2, 1, backups.getLastRow() - 1, 4)
      .getValues();
  
    const wantedDate = normalizeDate_(selectedDate);
  
    const row = rows.find(r =>
      r[0] instanceof Date &&
      normalizeDate_(r[0]) === wantedDate &&
      r[1] === wantedType
    );
  
    if (!row) {
      rep.getRange("D2").setValue(`❌ Backup not found (${wantedType})`);
      return;
    }
  
    const fileId = row[2];
  
    let snap = ss.getSheetByName("Source_Snapshot");
    if (!snap) {
      snap = ss.insertSheet("Source_Snapshot");
      snap.hideSheet();
    }
    snap.clearContents();
  
    const backupSS = SpreadsheetApp.openById(fileId);
  
    const sourceSheetName =
      wantedType === "CONFLUENCE" ? "Source_Confluence" : "source";
  
    const source = backupSS.getSheetByName(sourceSheetName);
    if (!source) {
      rep.getRange("D2").setValue("❌ Invalid backup structure");
      return;
    }
  
    const data = source.getDataRange().getValues();
    snap.getRange(1, 1, data.length, data[0].length).setValues(data);
  
    const query = rep.getRange("B2").getDisplayValue().trim();
    if (!query) {
      rep.getRange("D2").setValue(`✔ Loaded ${wantedType} backup`);
      return;
    }
  
    wantedType === "CONFLUENCE"
      ? fillConfluenceReportResults_()
      : fillReportResults_();
  }
  
  function normalizeDate_(d) {
    return Utilities.formatDate(
      new Date(d),
      Session.getScriptTimeZone(),
      'yyyy-MM-dd'
    );
  }
  
   