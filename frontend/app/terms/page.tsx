import { Navigation } from "@/components/navigation";

export default function TermsPage() {
  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-[32px] md:text-[42px] font-bold leading-tight mb-8">
          Términos y <span className="bg-ve-yellow px-2">Condiciones</span>
        </h1>

        <div className="bg-white border-4 border-black rounded-xl p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] prose prose-sm max-w-none">
          <p className="text-sm text-[#393939] mb-6"><strong>Última actualización:</strong> Mayo 2026</p>

          <h2 className="text-xl font-bold mt-6 mb-3">1. Aceptación de los Términos</h2>
          <p className="text-sm text-[#393939] mb-4">
            Al registrarte y utilizar la plataforma Wira (&quot;la Plataforma&quot;), aceptas estar sujeto a estos Términos y Condiciones. Si no estás de acuerdo con alguno de estos términos, no debes utilizar la Plataforma.
          </p>

          <h2 className="text-xl font-bold mt-6 mb-3">2. Descripción del Servicio</h2>
          <p className="text-sm text-[#393939] mb-4">
            Wira es un marketplace descentralizado que conecta freelancers con clientes, utilizando la blockchain de Solana para pagos en USDC mediante contratos inteligentes de escrow. La Plataforma actúa únicamente como intermediario tecnológico y no es parte en las transacciones entre usuarios.
          </p>

          <h2 className="text-xl font-bold mt-6 mb-3">3. Registro y Cuentas</h2>
          <ul className="text-sm text-[#393939] mb-4 list-disc pl-5 space-y-1">
            <li>Debes tener al menos 18 años para registrarte.</li>
            <li>La información proporcionada debe ser veraz y actualizada.</li>
            <li>Eres responsable de la seguridad de tu wallet y credenciales.</li>
            <li>Una persona o entidad solo puede tener una cuenta activa.</li>
            <li>Nos reservamos el derecho de suspender o eliminar cuentas que violen estos términos.</li>
          </ul>

          <h2 className="text-xl font-bold mt-6 mb-3">4. Servicios y Órdenes</h2>
          <ul className="text-sm text-[#393939] mb-4 list-disc pl-5 space-y-1">
            <li>Los freelancers son responsables de la calidad y entrega de sus servicios.</li>
            <li>Los precios se establecen en USDC y se bloquean en escrow al momento de la contratación.</li>
            <li>El freelancer tiene un máximo de 24 horas para aceptar una orden, de lo contrario será cancelada automáticamente.</li>
            <li>El cliente debe revisar y aprobar el trabajo entregado en un plazo razonable (máximo 7 días).</li>
            <li>Una vez aprobado el trabajo, los fondos se liberan al freelancer y no hay posibilidad de reembolso.</li>
          </ul>

          <h2 className="text-xl font-bold mt-6 mb-3">5. Pagos y Escrow</h2>
          <ul className="text-sm text-[#393939] mb-4 list-disc pl-5 space-y-1">
            <li>Todos los pagos se realizan en USDC a través de la red Solana (Devnet durante la fase beta).</li>
            <li>Los fondos permanecen en escrow (contrato inteligente) hasta que el cliente apruebe la entrega.</li>
            <li>La Plataforma no cobra comisiones durante la fase beta. Las comisiones futuras serán anunciadas con anticipación.</li>
            <li>Las tarifas de red (gas fees) de Solana son responsabilidad del usuario que inicia la transacción.</li>
            <li>La Plataforma no es responsable por fluctuaciones en el valor del USDC u otras criptomonedas.</li>
          </ul>

          <h2 className="text-xl font-bold mt-6 mb-3">6. Conducta Prohibida</h2>
          <p className="text-sm text-[#393939] mb-2">Está estrictamente prohibido:</p>
          <ul className="text-sm text-[#393939] mb-4 list-disc pl-5 space-y-1">
            <li>Publicar contenido ilegal, fraudulento, difamatorio u ofensivo.</li>
            <li>Ofrecer servicios ilegales o que infrinjan derechos de propiedad intelectual.</li>
            <li>Manipular calificaciones o reseñas (crear reseñas falsas, intercambiar reseñas).</li>
            <li>Crear múltiples cuentas para evadir restricciones o manipular el sistema.</li>
            <li>Realizar transacciones fuera de la Plataforma para evadir el sistema de escrow.</li>
            <li>Subir archivos maliciosos, virus o malware (todos los archivos son escaneados por VirusTotal).</li>
            <li>Acosar, amenazar o discriminar a otros usuarios.</li>
            <li>Utilizar bots, scrapers o herramientas automatizadas sin autorización.</li>
            <li>Intentar manipular o explotar vulnerabilidades en los contratos inteligentes.</li>
          </ul>

          <h2 className="text-xl font-bold mt-6 mb-3">7. Sistema de Reseñas y Calificaciones</h2>
          <ul className="text-sm text-[#393939] mb-4 list-disc pl-5 space-y-1">
            <li>Las reseñas son públicas y permanentes.</li>
            <li>Solo clientes que hayan completado una orden pueden dejar reseñas.</li>
            <li>Las reseñas deben ser honestas y basadas en la experiencia real.</li>
            <li>La Plataforma se reserva el derecho de eliminar reseñas que violen estos términos.</li>
          </ul>

          <h2 className="text-xl font-bold mt-6 mb-3">8. Reportes y Disputas</h2>
          <ul className="text-sm text-[#393939] mb-4 list-disc pl-5 space-y-1">
            <li>Los usuarios pueden reportar anuncios o comportamientos que violen estos términos.</li>
            <li>El equipo de administración revisará los reportes en un plazo de 48 horas.</li>
            <li>En caso de disputa, la Plataforma podrá mediar y tomar decisiones vinculantes.</li>
            <li>Los reembolsos en disputas están sujetos a revisión y aprobación del equipo administrativo.</li>
          </ul>

          <h2 className="text-xl font-bold mt-6 mb-3">9. Propiedad Intelectual</h2>
          <ul className="text-sm text-[#393939] mb-4 list-disc pl-5 space-y-1">
            <li>Los freelancers transfieren los derechos de uso del trabajo entregado al cliente una vez aprobado y pagado.</li>
            <li>Los freelancers garantizan que su trabajo es original y no infringe derechos de terceros.</li>
            <li>La marca &quot;Wira&quot;, su logotipo y diseño son propiedad exclusiva de la Plataforma.</li>
          </ul>

          <h2 className="text-xl font-bold mt-6 mb-3">10. Privacidad y Datos</h2>
          <ul className="text-sm text-[#393939] mb-4 list-disc pl-5 space-y-1">
            <li>Recopilamos email, nombre, wallet address y datos de uso para operar la Plataforma.</li>
            <li>Los archivos subidos son escaneados por VirusTotal para seguridad de todos los usuarios.</li>
            <li>No vendemos ni compartimos datos personales con terceros sin consentimiento.</li>
            <li>Las transacciones en blockchain son públicas por naturaleza.</li>
          </ul>

          <h2 className="text-xl font-bold mt-6 mb-3">11. Limitación de Responsabilidad</h2>
          <ul className="text-sm text-[#393939] mb-4 list-disc pl-5 space-y-1">
            <li>La Plataforma se proporciona &quot;tal cual&quot; sin garantías de ningún tipo.</li>
            <li>No somos responsables por la calidad del trabajo de los freelancers.</li>
            <li>No somos responsables por pérdidas financieras derivadas de vulnerabilidades en smart contracts, errores de red, o fallas técnicas.</li>
            <li>No somos responsables por interrupciones del servicio o pérdida de datos.</li>
          </ul>

          <h2 className="text-xl font-bold mt-6 mb-3">12. Suspensión y Terminación</h2>
          <ul className="text-sm text-[#393939] mb-4 list-disc pl-5 space-y-1">
            <li>Podemos suspender o terminar tu cuenta por violación de estos términos.</li>
            <li>En caso de suspensión, los fondos en escrow serán manejados según las políticas de disputa.</li>
            <li>Puedes eliminar tu cuenta en cualquier momento, sujeto a órdenes pendientes.</li>
          </ul>

          <h2 className="text-xl font-bold mt-6 mb-3">13. Modificaciones</h2>
          <p className="text-sm text-[#393939] mb-4">
            Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios serán notificados a los usuarios registrados por correo electrónico. El uso continuado de la Plataforma después de las modificaciones constituye aceptación de los nuevos términos.
          </p>

          <h2 className="text-xl font-bold mt-6 mb-3">14. Contacto</h2>
          <p className="text-sm text-[#393939] mb-4">
            Para consultas, reportes o disputas, contacta al equipo de administración a través del panel de la Plataforma o al correo <strong>arepaweb3@gmail.com</strong>.
          </p>

          <div className="mt-8 pt-6 border-t-2 border-black/10">
            <p className="text-xs text-[#393939] text-center">
              © 2026 Wira. Todos los derechos reservados. Construido sobre Solana.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
