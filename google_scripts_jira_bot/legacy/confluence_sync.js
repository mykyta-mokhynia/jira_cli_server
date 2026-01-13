// Common functions and constants are in config.js
// resolveUserByAccountId_ is in config.js

function fetchAllSpaces_() {
  let start = 0;
  const limit = 50;
  const spaces = [];

  while (true) {
    const res = jiraFetchAbsolute_(
      `${CONF_REST_API}/space?start=${start}&limit=${limit}`
    );

    spaces.push(...(res.results || []));
    if (!res._links?.next) break;
    start += limit;
  }

  return spaces; // { key, name, type }
}

function fetchSpaceWithPermissions_(spaceKey) {
  return jiraFetchAbsolute_(
    `${CONF_REST_API}/space/${encodeURIComponent(spaceKey)}?expand=permissions`
  );
}

function updateSourceFromConfluenceApi() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName('Source_Confluence');
  if (!sh) throw new Error('Source_Confluence sheet not found');

  sh.clear();
  sh.clearFormats();

  sh.getRange(1, 1, 1, 8).setValues([[
    'Name',
    'Surname',
    'Email',
    'SpaceKey',
    'SpaceName',
    'Permission',
    'GrantedVia',
    'GrantedBy'
  ]]);

  const spaces = fetchAllSpaces_().filter(s => s.type === 'global');
  const out = [];

  spaces.forEach(space => {
    const spaceFull = fetchSpaceWithPermissions_(space.key);

    const permissions = Array.isArray(spaceFull.permissions)
      ? spaceFull.permissions
      : [];

    permissions.forEach(p => {
      const op = p.operation?.operation;
      if (!op) return;

      const permission =
        op === 'administer' ? 'Admin' :
        op === 'write'      ? 'Edit'  :
                              'View';

      const users = p.subjects?.user?.results || [];
      users.forEach(u => {
        const ru = resolveUserByAccountId_(u.accountId);
        if (!ru) return;

        out.push([
          ru.name,
          ru.surname,
          ru.email,
          space.key,
          space.name,
          permission,
          'User',
          ru.email || ru.accountId
        ]);
      });
      
      const groups = p.subjects?.group?.results || [];
      groups.forEach(g => {
        out.push([
          '',
          '',
          '',
          space.key,
          space.name,
          permission,
          'Group',
          g.name
        ]);
      });
    });
  });

  if (!out.length) {
    throw new Error('No space permissions collected (unexpected for this site)');
  }

  sh.getRange(2, 1, out.length, out[0].length).setValues(out);

  sh.getRange(2, 1, out.length, out[0].length).sort([
    { column: 4, ascending: true }, 
    { column: 6, ascending: true }, 
    { column: 2, ascending: true } 
  ]);

  sh.autoResizeColumns(1, 8);
  sh.setFrozenRows(1);
}
