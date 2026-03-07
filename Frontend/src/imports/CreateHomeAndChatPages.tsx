import clsx from "clsx";
import svgPaths from "./svg-etnh5v7l3k";
import imgImg from "figma:asset/cf24a05d7bab431c95d30e2583597f4692c35574.png";
import imgImg1 from "figma:asset/9bd888463ca9367ff14ba6b7ad16ee6a7d8a7be9.png";
import imgImg2 from "figma:asset/441daa1dae41629e2a7035f925ccb7f3a7efff67.png";
type Wrapper4Props = {
  additionalClassNames?: string;
};

function Wrapper4({ children, additionalClassNames = "" }: React.PropsWithChildren<Wrapper4Props>) {
  return (
    <div className={clsx("relative shrink-0", additionalClassNames)}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative size-full">{children}</div>
    </div>
  );
}

function Input({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="flex-[1_0_0] h-[16.5px] min-h-px min-w-px relative">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center overflow-clip relative rounded-[inherit] size-full">{children}</div>
    </div>
  );
}

function Wrapper3({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 size-[13px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
        {children}
      </svg>
    </div>
  );
}
type Wrapper2Props = {
  additionalClassNames?: string;
};

function Wrapper2({ children, additionalClassNames = "" }: React.PropsWithChildren<Wrapper2Props>) {
  return (
    <div className={additionalClassNames}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">{children}</div>
    </div>
  );
}
type Wrapper1Props = {
  additionalClassNames?: string;
};

function Wrapper1({ children, additionalClassNames = "" }: React.PropsWithChildren<Wrapper1Props>) {
  return <Wrapper2 additionalClassNames={clsx("flex-[1_0_0] min-h-px min-w-px relative", additionalClassNames)}>{children}</Wrapper2>;
}
type WrapperProps = {
  additionalClassNames?: string;
};

function Wrapper({ children, additionalClassNames = "" }: React.PropsWithChildren<WrapperProps>) {
  return <Wrapper2 additionalClassNames={clsx("relative shrink-0", additionalClassNames)}>{children}</Wrapper2>;
}

function Container({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="h-[46px] relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border border-black border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[8px] items-center px-[13px] py-px relative size-full">{children}</div>
      </div>
    </div>
  );
}
type ButtonTextProps = {
  text: string;
  additionalClassNames?: string;
};

function ButtonText({ text, additionalClassNames = "" }: ButtonTextProps) {
  return (
    <Wrapper2 additionalClassNames={clsx("h-[15px] relative", additionalClassNames)}>
      <p className="-translate-x-1/2 absolute font-['Consolas:Medium',sans-serif] leading-[15px] left-[21px] not-italic text-[#6a7282] text-[10px] text-center top-[-1px] tracking-[0.5px] whitespace-nowrap">{text}</p>
    </Wrapper2>
  );
}
type SpanTextProps = {
  text: string;
  additionalClassNames?: string;
};

function SpanText({ text, additionalClassNames = "" }: SpanTextProps) {
  return (
    <div className={clsx("absolute h-[12px] top-0", additionalClassNames)}>
      <p className="absolute font-['Consolas:Regular',sans-serif] leading-[12px] left-0 not-italic text-[#6a7282] text-[8px] top-0 tracking-[0.8px] whitespace-nowrap">{text}</p>
    </div>
  );
}
type LabelTextProps = {
  text: string;
};

function LabelText({ text }: LabelTextProps) {
  return (
    <div className="h-[13.5px] relative shrink-0 w-full">
      <p className="absolute font-['Consolas:Medium',sans-serif] leading-[13.5px] left-0 not-italic text-[9px] text-black top-[-1px] tracking-[1.5px] whitespace-nowrap">{text}</p>
    </div>
  );
}

export default function CreateHomeAndChatPages() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start relative size-full" data-name="Create Home and Chat Pages">
      <div className="h-[63px] relative shrink-0 w-[1419px]" data-name="header">
        <div aria-hidden="true" className="absolute border-[#f3f4f6] border-b border-solid inset-0 pointer-events-none" />
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between pb-px px-[24px] relative size-full">
          <div className="h-[38px] relative shrink-0 w-[159.203px]" data-name="img">
            <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 max-w-none object-contain pointer-events-none size-full" src={imgImg} />
          </div>
          <Wrapper additionalClassNames="h-[18px] w-[122.375px]">
            <p className="absolute font-['Consolas:Bold',sans-serif] leading-[18px] left-0 not-italic text-[12px] text-black top-0 tracking-[0.6px] whitespace-nowrap">{`{ AUTH REQUIRED }`}</p>
          </Wrapper>
        </div>
      </div>
      <div className="flex-[1_0_0] min-h-px min-w-px relative w-[1419px]" data-name="main">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center relative size-full">
          <div className="h-[611px] relative shrink-0 w-[560px]" data-name="div">
            <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[20px] items-start relative size-full">
              <div className="bg-[rgba(255,255,255,0)] h-[531px] relative shrink-0 w-full" data-name="Container">
                <div aria-hidden="true" className="absolute border-2 border-black border-solid inset-0 pointer-events-none shadow-[4px_4px_0px_0px_black]" />
                <div className="content-stretch flex flex-col items-start p-[2px] relative size-full">
                  <div className="h-[108px] relative shrink-0 w-full" data-name="Container">
                    <div className="content-stretch flex flex-col gap-[6px] items-start pt-[32px] px-[40px] relative size-full">
                      <div className="h-[35px] relative shrink-0 w-full" data-name="h1">
                        <p className="absolute font-['Consolas:Regular',sans-serif] leading-[35px] left-0 not-italic text-[28px] text-black top-[-1px] tracking-[1px] whitespace-nowrap">TERMINAL LOGIN</p>
                      </div>
                      <div className="h-[15px] opacity-60 relative shrink-0 w-full" data-name="p">
                        <p className="absolute font-['Consolas:Regular',sans-serif] leading-[15px] left-0 not-italic text-[10px] text-black top-[-1px] tracking-[4px] whitespace-nowrap">Secure Gateway for A Mobility</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-black h-px shrink-0 w-full" data-name="Container" />
                  <div className="content-stretch flex h-[44px] items-start pb-px relative shrink-0 w-full" data-name="Container">
                    <div aria-hidden="true" className="absolute border-b border-black border-solid inset-0 pointer-events-none" />
                    <Wrapper1 additionalClassNames="bg-black h-[43px]">
                      <p className="-translate-x-1/2 absolute font-['Consolas:Bold',sans-serif] leading-[15px] left-[139.25px] not-italic text-[10px] text-center text-white top-[13px] tracking-[1px] whitespace-nowrap">Login</p>
                    </Wrapper1>
                    <Wrapper1 additionalClassNames="bg-white h-[43px]">
                      <p className="-translate-x-1/2 absolute font-['Consolas:Bold',sans-serif] leading-[15px] left-[139.75px] not-italic text-[10px] text-black text-center top-[13px] tracking-[1px] whitespace-nowrap">Sign up</p>
                    </Wrapper1>
                  </div>
                  <div className="h-[345px] relative shrink-0 w-full" data-name="form">
                    <div className="content-stretch flex flex-col gap-[16px] items-start pt-[28px] px-[40px] relative size-full">
                      <div className="content-stretch flex flex-col gap-[6px] h-[65.5px] items-start relative shrink-0 w-full" data-name="div">
                        <LabelText text="TERMINAL ID / EMAIL" />
                        <Container>
                          <Wrapper3>
                            <g id="Mail">
                              <path d={svgPaths.p5cbbe00} id="Vector" stroke="var(--stroke-0, #99A1AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08333" />
                              <path d={svgPaths.p26d0d9c0} id="Vector_2" stroke="var(--stroke-0, #99A1AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08333" />
                            </g>
                          </Wrapper3>
                          <Input>
                            <p className="font-['Consolas:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#d1d5dc] text-[11px] tracking-[0.55px] whitespace-nowrap">S.JOBS@UNIVERSITY.EDU</p>
                          </Input>
                        </Container>
                      </div>
                      <div className="content-stretch flex flex-col gap-[6px] h-[65.5px] items-start relative shrink-0 w-full" data-name="div">
                        <LabelText text="ACCESS KEY / PASSWORD" />
                        <Container>
                          <Wrapper3>
                            <g id="Lock">
                              <path d={svgPaths.p2f93d80} id="Vector" stroke="var(--stroke-0, #99A1AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08333" />
                              <path d={svgPaths.pfa625af} id="Vector_2" stroke="var(--stroke-0, #99A1AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08333" />
                            </g>
                          </Wrapper3>
                          <Input>
                            <p className="font-['Consolas:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[11px] text-[rgba(10,10,10,0.5)] tracking-[1.1px] whitespace-nowrap">••••••••••••</p>
                          </Input>
                          <div className="relative shrink-0 size-[13px]" data-name="button">
                            <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
                              <div className="h-[13px] overflow-clip relative shrink-0 w-full" data-name="Eye">
                                <div className="absolute inset-[20.84%_8.33%]" data-name="Vector">
                                  <div className="absolute inset-[-7.14%_-5%]">
                                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.9172 8.666">
                                      <path d={svgPaths.p853a380} id="Vector" stroke="var(--stroke-0, #99A1AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08333" />
                                    </svg>
                                  </div>
                                </div>
                                <div className="absolute inset-[37.5%]" data-name="Vector">
                                  <div className="absolute inset-[-16.67%]">
                                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4.33333 4.33333">
                                      <path d={svgPaths.p3e3a4d80} id="Vector" stroke="var(--stroke-0, #99A1AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.08333" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Container>
                      </div>
                      <div className="content-stretch flex h-[14px] items-center justify-between relative shrink-0 w-full" data-name="div">
                        <Wrapper4 additionalClassNames="h-[14px] w-[81.391px]">
                          <div className="bg-white relative shrink-0 size-[14px]" data-name="div">
                            <div aria-hidden="true" className="absolute border border-black border-solid inset-0 pointer-events-none" />
                          </div>
                          <Wrapper1 additionalClassNames="h-[13.5px]">
                            <p className="absolute font-['Consolas:Medium',sans-serif] leading-[13.5px] left-0 not-italic text-[#0a0a0a] text-[9px] top-[-1px] tracking-[0.45px] whitespace-nowrap">STAY ACTIVE</p>
                          </Wrapper1>
                        </Wrapper4>
                        <Wrapper additionalClassNames="h-[13.5px] w-[53.984px]">
                          <p className="-translate-x-1/2 absolute decoration-solid font-['Consolas:Medium',sans-serif] leading-[13.5px] left-[27.5px] not-italic text-[#0a0a0a] text-[9px] text-center top-[-1px] tracking-[0.45px] underline whitespace-nowrap">RESET KEY?</p>
                        </Wrapper>
                      </div>
                      <div className="bg-black h-[52px] relative shrink-0 w-full" data-name="button">
                        <p className="-translate-x-1/2 absolute font-['Consolas:Bold',sans-serif] leading-[16.5px] left-[226.97px] not-italic text-[11px] text-center text-white top-[16.75px] tracking-[1.1px] whitespace-nowrap">Sign In</p>
                        <div className="absolute left-[259.52px] size-[15px] top-[18.5px]" data-name="ChevronRight">
                          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
                            <g id="ChevronRight">
                              <path d={svgPaths.p5646280} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
                            </g>
                          </svg>
                        </div>
                      </div>
                      <div className="h-[28px] relative shrink-0 w-full" data-name="p">
                        <p className="-translate-x-1/2 absolute font-['Consolas:Regular',sans-serif] leading-[13.5px] left-[173.77px] not-italic text-[#0a0a0a] text-[9px] text-center top-[11px] tracking-[0.45px] whitespace-nowrap">{`NEW USER? `}</p>
                        <div className="absolute h-[24px] left-[200.27px] top-[4px] w-[129.469px]" data-name="button">
                          <p className="-translate-x-1/2 absolute decoration-solid font-['Consolas:Bold',sans-serif] leading-[24px] left-[65.5px] not-italic text-[#0a0a0a] text-[16px] text-center top-[-1px] tracking-[0.45px] underline whitespace-nowrap">CREATE ACCOUNT</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#f9f9f9] h-[29px] relative shrink-0 w-full" data-name="Container">
                    <div aria-hidden="true" className="absolute border-black border-solid border-t inset-0 pointer-events-none" />
                    <div className="flex flex-row items-center size-full">
                      <div className="content-stretch flex items-center justify-between pt-px px-[24px] relative size-full">
                        <Wrapper additionalClassNames="h-[12px] w-[187.969px]">
                          <div className="absolute bg-[#00c950] left-0 rounded-[33554400px] size-[8px] top-[2px]" data-name="span" />
                          <SpanText text="ENCRYPTION: AES-256" additionalClassNames="left-[16px] w-[98.781px]" />
                          <SpanText text="SSL: SECURE" additionalClassNames="left-[130.78px] w-[57.188px]" />
                        </Wrapper>
                        <Wrapper additionalClassNames="h-[12px] w-[93.578px]">
                          <p className="absolute font-['Consolas:Regular',sans-serif] leading-[12px] left-0 not-italic text-[#99a1af] text-[8px] top-0 tracking-[0.8px] whitespace-nowrap">NODE ID: P01 • • •</p>
                        </Wrapper>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex h-[60px] items-start justify-center relative shrink-0 w-full" data-name="Container">
                <div className="h-[60px] opacity-70 relative shrink-0 w-[212.938px]" data-name="img">
                  <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 max-w-none object-contain pointer-events-none size-full" src={imgImg1} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="h-[40px] relative shrink-0 w-[1419px]" data-name="footer">
        <div aria-hidden="true" className="absolute border-[#f3f4f6] border-solid border-t inset-0 pointer-events-none" />
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between pt-px px-[24px] relative size-full">
          <Wrapper4 additionalClassNames="h-[15px] w-[279.656px]">
            <div className="h-[12px] opacity-60 relative shrink-0 w-[13.234px]" data-name="img">
              <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImg2} />
            </div>
            <Wrapper1 additionalClassNames="h-[15px]">
              <p className="absolute font-['Consolas:Regular',sans-serif] leading-[15px] left-0 not-italic text-[#6a7282] text-[10px] top-[-1px] whitespace-nowrap">Protected by University Authentication Protocol</p>
            </Wrapper1>
          </Wrapper4>
          <div className="h-[15px] relative shrink-0 w-[154px]" data-name="div">
            <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[20px] items-center relative size-full">
              <Wrapper additionalClassNames="h-[15px] w-[30px]">
                <p className="-translate-x-1/2 absolute font-['Consolas:Medium',sans-serif] leading-[15px] left-[15.5px] not-italic text-[#6a7282] text-[10px] text-center top-[-1px] tracking-[0.5px] whitespace-nowrap">TERMS</p>
              </Wrapper>
              <ButtonText text="PRIVACY" additionalClassNames="shrink-0 w-[42px]" />
              <ButtonText text="SUPPORT" additionalClassNames="flex-[1_0_0] min-h-px min-w-px" />
            </div>
          </div>
          <Wrapper additionalClassNames="h-[15px] w-[185.953px]">
            <p className="absolute font-['Consolas:Regular',sans-serif] leading-[15px] left-0 not-italic text-[#d1d5dc] text-[10px] top-[-1px] tracking-[0.5px] whitespace-nowrap">© 2026 UNI-LIFT TERMINAL V1.0.4</p>
          </Wrapper>
        </div>
      </div>
    </div>
  );
}