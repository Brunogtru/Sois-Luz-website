/* =============================================
   Sois Luz — supabase-client.js
   Inicializa o cliente Supabase e exporta como
   variável global `db` para uso em todas as páginas.

   INSTRUÇÕES:
   1. Substitua 'YOUR_SUPABASE_URL' pela URL do seu projeto
      (ex: https://xxxxxxxx.supabase.co)
   2. Substitua 'YOUR_SUPABASE_ANON_KEY' pela sua chave
      pública (anon key). NUNCA use a service_role key aqui.
   3. O SDK do Supabase deve ser carregado via CDN ANTES
      deste arquivo no HTML.
============================================= */

var SUPABASE_URL = 'https://zmtzacpvkhsmgzjsetud.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptdHphY3B2a2hzbWd6anNldHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNDQ3MzksImV4cCI6MjA5NDgyMDczOX0.WK5yXSdLbKfWnLkOhlFx5BoBfUX2AyEzvtTaVd7Q8WU';

var db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_KEY;

