const fs = require('fs');

// Patch analytics.ts
let analyticsStr = fs.readFileSync('src/lib/api/analytics.ts', 'utf8');
if (!analyticsStr.includes('export async function getResellerRanking')) {
  let resellerFunc = `
// Ranking de Revendedores por Volume
export async function getResellerRanking() {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('reseller_id, total_amount, resellers(full_name)')
    .not('reseller_id', 'is', null)
    
  if (error || !orders) return []

  const ranking: Record<string, { id: string, name: string, total: number, orderCount: number }> = {}

  for (const order of orders) {
    if (!order.reseller_id) continue
    
    if (!ranking[order.reseller_id]) {
      ranking[order.reseller_id] = {
        id: order.reseller_id,
        name: (order.resellers as any)?.full_name || 'Desconhecido',
        total: 0,
        orderCount: 0
      }
    }
    
    ranking[order.reseller_id].total += Number(order.total_amount || 0)
    ranking[order.reseller_id].orderCount += 1
  }

  return Object.values(ranking).sort((a, b) => b.total - a.total)
}
`;
  analyticsStr += resellerFunc;
  fs.writeFileSync('src/lib/api/analytics.ts', analyticsStr, 'utf8');
}

// Patch page.tsx
let pageStr = fs.readFileSync('src/app/(app)/page.tsx', 'utf8');

// 1. Add import
if (!pageStr.includes('getResellerRanking')) {
  pageStr = pageStr.replace('getPendingFollowUps\n} from "@/lib/api/analytics"', 'getPendingFollowUps,\n  getResellerRanking\n} from "@/lib/api/analytics"');
}

// 2. Add state
pageStr = pageStr.replace('b2bRanking: [],\n    recurring:', 'b2bRanking: [],\n    resellerRanking: [],\n    recurring:');

// 3. Add to loadData
if (!pageStr.includes('resellerRankingData')) {
  pageStr = pageStr.replace('settingsData,\n          inactive,', 'settingsData,\n          inactive,\n          resellerRankingData,');
  pageStr = pageStr.replace('getSettings(),\n          getInactiveClients(60),', 'getSettings(),\n          getInactiveClients(60),\n          getResellerRanking(),');
  pageStr = pageStr.replace('setAnalytics({ clientRanking, b2bRanking, recurring', 'setAnalytics({ clientRanking, b2bRanking, resellerRanking: resellerRankingData, recurring');
}

// 4. Change Top Revendas (B2B) to Top Empresas (B2B)
pageStr = pageStr.replace('Top Revendas (B2B)', 'Top Empresas (B2B)');

// 5. Add Top Revendedores Card
let b2bCard = `          {/* Ranking B2B */}
          <Card className="shadow-sm flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-gray-700 text-base">
                <Building className="h-4 w-4 mr-2" /> Top Empresas (B2B)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-2">
                {analytics.b2bRanking.length > 0 ? analytics.b2bRanking.slice(0, 3).map((company: any, idx: number) => (
                  <div key={company.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-xs font-bold text-gray-400 w-4">{idx + 1}.</span>
                      <span className="text-sm font-medium truncate max-w-[120px]" title={company.name}>{company.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{company.orderCount} ped</span>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">Sem parceiros ativos.</p>
                )}
              </div>
            </CardContent>
          </Card>`;

let newResellerCard = `
          {/* Ranking Revendedores */}
          <Card className="shadow-sm flex-1 mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-gray-700 text-base">
                <Award className="h-4 w-4 mr-2 text-orange-500" /> Top Revendedores
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-2">
                {analytics.resellerRanking?.length > 0 ? analytics.resellerRanking.slice(0, 3).map((reseller: any, idx: number) => (
                  <div key={reseller.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-xs font-bold text-gray-400 w-4">{idx + 1}.</span>
                      <span className="text-sm font-medium truncate max-w-[120px]" title={reseller.name}>{reseller.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{reseller.orderCount} ped</span>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">Sem revendedores ativos.</p>
                )}
              </div>
            </CardContent>
          </Card>
`;
if (!pageStr.includes('Top Revendedores')) {
  pageStr = pageStr.replace(b2bCard, b2bCard + newResellerCard);
}

// 6. Recent Orders title
pageStr = pageStr.replace(/order\.clients\?\.full_name \|\| order\.companies\?\.business_name \|\| 'Cliente'/g, "order.clients?.full_name || order.companies?.business_name || order.resellers?.full_name || 'Cliente'");

fs.writeFileSync('src/app/(app)/page.tsx', pageStr, 'utf8');
console.log('done patching analytics');
